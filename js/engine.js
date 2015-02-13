/**
 * Created by Sun on 2/7/2015.
 */
var map;

$(document).on("pageshow","#index",function(){

    var notifications=JSON.parse(currentUser.get("notification"));



    for(var i=0;i<notifications.length;i++){
        var notice=new PNotify({
            title: "From " + notifications[i].user.username,
            text: notifications[i].message+"\n"+
                '<input type="text" id="notice'+i+'">'+'<button class="ui-btn" onclick="reply(\''+notifications[i].user.username+'\','+i+')">Reply</button>',

            buttons: {
                closer: true,
                sticker: false
            },
            icon: "ui-icon"
        });

        notice.get().dblclick(function(){
           this.remove();
        });


        console.log(notifications)

    };

    currentUser.set("notification",JSON.stringify([]));
    currentUser.save();

    $("#index h1").html("Welcome to Nearby Friend Caller! "+currentUser.get("username"));

    GMaps.geolocate({
        success:function(position){
            map=GMaps({
                div:"#Map",
                lat:position.coords.latitude,
                lng:position.coords.longitude,
                zoom:16
            });

            map.addMarker({
                lat:position.coords.latitude,
                lng:position.coords.longitude,
                infoWindow:{
                    content: "<p>You are here</p>"
                }
            })

        },
        error:function(error){
            alert("Cannot get location");
        }
    });

    initialize();

    $("#SubmitPost").click(function(){


        GMaps.geolocate({
            success: function(position){

                var newEvent=new Invitation();
                var invitationId;

                var category=$("#PostCategory").html();

                newEvent.ini($("#PostTitle").val(),currentUser.get("username"),$("#PostLast").val(),$("#PostCategory").html(),position.coords.latitude,position.coords.longitude);


                newEvent.save({
                    success: function(e){
                        invitationId=e.id;
                        newEvent=e;
                    },
                    error: function(error){
                        console.log("Error save the event. "+ error);
                    }
                });

                map.addMarker({
                    lat:position.coords.latitude,
                    lng:position.coords.longitude,

                    icon: category== "Gathering" ? "image/Gathering.png" : category=="Party" ? "image/Party.png" : category=="Meal" ? "image/Meal.png" : "image/Tutorial.png",

                    infoWindow:{
                        content : "<h2>Title: "+$("#PostTitle").val()+"</h2>"+
                        "<p>Category: "+$("#PostCategory").html()+"</p>"+
                        "<p>Last Until: "+$("#PostLast").val()+"</p>"+
                        '<p>Issuer: '+currentUser.get("username")+'</p>'+
                        "<button class='ui-btn' onclick='join(\""+invitationId + "\")'>Join</button>"+
                        "<button class='ui-btn' onclick='GetDirection("+newEvent.get("Lat")+','+newEvent.get("Lng")+")'>Get Way</button>"+
                            '<button class="ui-btn" onclick="getDetails(\''+newEvent.id+'\')">Get Details</button>'
                    },
                    size: new google.maps.Size(5, 5)
                });

            },
            error: function(error){
                console.log("Get geolocation failed. "+error);
            }
        });

        $.mobile.changePage("#index");
    });
});

$(document).on("pageshow","#MyInvitation",function(){


   var query=new Parse.Query(Invitation);
    query.equalTo("issuer",currentUser.get("username"));

    query.find({
        success: function(results){

            $("#MyInvitationList").html("");

            for(var i=0;i<results.length;i++){
                var newInvitation=results[i];


                var newLi=$("<li></li>");

                var con="<h2>"+newInvitation.get("title")+"</h2>"+
                        "<p>"+newInvitation.get("issuer")+"</p>"+
                        "<p>"+newInvitation.get("LastUntil")+"</p>"+
                        "<p>"+newInvitation.get("category")+"</p>"+
                        "<h3>Friends Invited: </h3>"

                var joiners=JSON.parse(newInvitation.get("Joiners"));

                for(var j=0;j<joiners.length;j++){
                    con+="<p>"+joiners[j].username+"</p>";
                }

                newLi.html(con);

                $("#MyInvitationList").append(newLi);
            }

            $("#MyInvitationList").listview("refresh");
        },
        error: function(error){
            console.log("Cannot load my invitations! "+error);
        }
    })
});

$(document).on("pageshow","#MyProfile",function(){
   if(currentUser.get("connected")){
       $("#FacebookLoginButton").hide();

       $("#myProfileData").html("");

       var con="<h2>Name: "+currentUser.get("name")+"</h2>"+
               "<p>username: "+currentUser.get("username")+"</p>"+
               "<p>gender: "+currentUser.get("gender")+"</p>"+
               "<p>Email: "+currentUser.get("email")+"</p>"+
           '<p>Facebook : <a href="'+currentUser.get("linkToFacebook")+'">'+currentUser.get("linkToFacebook")+'</a></p>'+
               '<button class="ui-btn" onclick="currentUser.disconnect()">Unbind with Facebook</button>';

       $("#myProfileData").html(con);

   }
    else{
       $("#myProfileData").html("");
       $("#FacebookLoginButton").show();
   }
});


//[{"password":"123","username":"Jack","objectId":"0S5ZYlvljB","createdAt":"2015-02-07T08:13:29.769Z","updatedAt":"2015-02-07T08:13:29.769Z"}]

function initialize(){


    var invitations;

    var query=new Parse.Query(Invitation);

    query.find({
        success: function(results){

            //console.log(results);

            var currentTime=new Date().getHours()+":"+new Date().getMinutes();


            invitations=results;

            var newMarkers=[];

            for(var i=0;i<results.length;i++){

                ////These are to delete the out of date Invitations

                //var lastUntil=results[i].get("LastUntil");
                //
                //if(lastUntil < currentTime){
                //    results[i].destroy();
                //    console.log(lastUntil);
                //
                //    continue;
                //}

                var category=invitations[i].get("category");


                newMarkers.push({
                    lat:invitations[i].get("Lat"),
                    lng:invitations[i].get("Lng"),
                    icon: category == "Gathering" ? "image/Gathering.png" : category == "Party" ? "image/Party.png" : category== "Meal" ? "image/Meal.png" : "image/Tutorial.png",

                    infoWindow:{
                        content : "<h2>Title: "+invitations[i].get("title")+"</h2>"+
                        "<p>Category: "+invitations[i].get("category")+"</p>"+
                        "<p>Last Until: "+invitations[i].get("LastUntil")+"</p>"+
                            '<p>Issuer: '+invitations[i].get("issuer")+'</p>'+
                        "<button class='ui-btn' onclick='join(\""+invitations[i].id + "\")'>Join</button>"+
                        "<button class='ui-btn' onclick='startChat(\"" + invitations[i].get("issuer")+"\")'>Chat</button>"+
                        "<button class='ui-btn' onclick='GetDirection("+invitations[i].get("Lat")+','+invitations[i].get("Lng")+")'>Get Way</button>"+
                        '<button class="ui-btn" onclick="getDetails(\''+invitations[i].id+'\')">Get Details</button>'
                    }

                });


            }
            console.log(newMarkers);

            map.addMarkers(newMarkers);
        },
        error:function(error){
            console.log("Error occurs when dealing with events. "+error);
        }
    });


}

var addEvent=function(event){

    $("#PostCategory").html(event);

    $.mobile.changePage("#DetailsOfEvents");

}
