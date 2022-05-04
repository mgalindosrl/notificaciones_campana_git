///En este caso vamos a usar el SDK de Genesys por que es una aplicacion backend

///const dbServices = require('./db');

///Cargamos el SDK
const platformClient = require('purecloud-platform-client-v2');
///Cargamos una libreria de WebSocket
const WebSocket = require('ws');

///Definicion de objetos para Apis
///client = objeto principal
///notificationsApi = Api de notificaciones
///outboundApi = Api de outbound

let client = platformClient.ApiClient.instance;
let notificationsApi = new platformClient.NotificationsApi();
let outboundApi = new platformClient.OutboundApi();

var clientId = "18d6511d-58ba-4379-95f4-636375146a3a";
var clientSecret = "9OaeVNTQrtk897FghNDpbvOj7OJUUoIGILBWnR50PoE";

////Metodo para conectarnos a las notificaciones
var Notifications = () => {
    notificationsApi.postNotificationsChannels()
        .then((data) => {
            var wsn = new WebSocket(data.connectUri);

            ////Si queremos agregar mas colas a las notificaciones, agregamos mas objetos cambiando el queueId
            wsn.onopen = (o) => {
                var body = [
                    { "id": "v2.routing.queues.d7addc38-2a59-47ab-808b-bff94b0c7d67.conversations"}
                ];

                notificationsApi.postNotificationsChannelSubscriptions(data.id, body)
                    .then((resp) => {
                        console.log(resp);
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }

            wsn.onmessage = (e) => {
                ////Obtenemos la informacion del topico
                var topic = JSON.parse(e.data);

                if (topic.eventBody.message != "WebSocket Heartbeat") {
                    topic.eventBody.participants.forEach((val, index) => {
                        ////Detectamos unicamente los eventos del dialer
                        if (val.purpose == "dialer.system") {
                            if (val.calls && val.wrapup) {
                                ///Si existe una llamada y wrapup seguimos
                                if (val.calls[0].state == "terminated") {
                                    ////si ya esta terminada la llamada, obtenemos la informacion del lead
                                    getContact(val.attributes.dialerContactId, val.attributes.dialerContactListId)
                                        .then((response) => {
                                            ////Obtenemos los datos del registro para obtener el campo que funcionara como id en tu bd
                                            console.log('lead Id');
                                            console.log(response.data);
                                            ////Ocupamos el codigo de clasificacion automatica de Genesys
                                            console.log('codigo');
                                            console.log(val.wrapup.code);


                                            /////Llamamos al metodo para insertar en bd (este solo es un ejemplo de codigo);
                                            /*dbServices.actualizarRegistro()
                                                .then((response) => {
                                                    console.log(response);
                                                })
                                                .errot((err) => {
                                                    console.log(err);
                                                })*/
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }
                            }
                        }
                    })
                }
            }

            wsn.onerror = (s) => {
                console.log("error");
                console.log(s);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

var newCloudSession = () => {
    client.loginClientCredentialsGrant(clientId, clientSecret)
        .then((response) => {
            notificationsApi = new platformClient.NotificationsApi();
            outboundApi = new platformClient.OutboundApi();

            Notifications();
            console.log("SESSION CREATED");
        })
        .catch((error) => {
            console.log(error);
        })
};

var getContact = (contactId, contactList) => {
    return new Promise((resolve, reject) => {
        outboundApi.getOutboundContactlistContact(contactList, contactId)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    })
}

newCloudSession();