/**
 * Created by Sun on 2/7/2015.
 */
Parse.initialize("u69qJREkjBxioKLH08v0G9kK5fWHMoEJ9r2SnuiU", "3iZO7rI8ZUQHl9EHFAes0PmdHHLAo3ZGYP6M1ED7");

var currentUser=null;

//var socket = io('http://localhost');
//socket.on('news', function (data) {
//    var message=data.joiner+" joined "+data.owner+" "+data.category+" "+data.title;
//
//    alert(message);
//});

var player=Parse.Object.extend("player",{

    ini:function(username,password){

        this.set("username",username);
        this.set("password",password);
        this.set("notification",JSON.stringify([]));
    },
    addNotification: function(user,message){
        var notifications=JSON.parse(this.get("notification"));

        notifications.push({user:user,message:message});

        this.set("notification",JSON.stringify(notifications));

        this.save();
    },
    addProfile:function(data){
        this.set("connected",true);

        this.set("email",data.email);
        this.set("gender",data.gender);
        this.set("name",data.name);
        this.set("linkToFacebook",data.link);

        this.save();
    },
    disconnect:function(){
        this.unset("connected");
        this.unset("email");
        this.unset("gender");
        this.unset("name");
        this.unset("linkToFacebook");
        this.save();
    }

});

var Invitation=Parse.Object.extend("Invitation",{

    ini:function(title,issuer,LastUntil,category,Lat,Lng){
        this.set("title",title);
        this.set("issuer",issuer);
        this.set("LastUntil",LastUntil);

        this.set("category",category);

        this.set("Lat",Lat);
        this.set("Lng",Lng);

        this.set("Joiners",JSON.stringify([]));

    },

    addJoiner:function(user){
        var joiners=JSON.parse(this.get("Joiners"));

        joiners.push(user);

        this.set("Joiners",JSON.stringify(joiners));
    },

    completed:function(){
        this.destroy({
            success: function(myObject){

            },error: function(error){
                console.log(error);
            }
        })
    }

});

var task=Parse.Object.extend("task", {

    ini: function (title, issuer, LastUntil, description, Lat, Lng) {
        this.set("title", title);
        this.set("issuer", issuer);
        this.set("LastUntil", LastUntil);
        this.set("description", description);

        this.set("Lat", Lat);
        this.set("Lng", Lng);

    },
    taken:function(){

    }
});

function Register(){
        if($("#RegisterUsername").val() && $("#RegisterPassword").val() && $("#RegisterPassword").val()==$("#ConfirmPassword").val()){

            var newUser=new player();
            newUser.ini($("#RegisterUsername").val() , $("#RegisterPassword").val());

            newUser.save(null,{
                success : function(newUser){
                    $("#RegisterSuccess").html("User "+newUser.get("username")+" created!");
                    currentUser=newUser;

                    $("#RegisterSuccess").html("New user Created! "+newUser.get("username"));
                },
                error:function(error){

                }});


        }

}

function Login(){
    var query=new Parse.Query(player);

    query.equalTo("username",$("#LoginUsername").val());

    query.find({
        success:function(result){
            if(result.length>1){
                return;

            }else{
                var pass=result[0].get('password');

                if($("#LoginPassword").val()==pass){

                    currentUser=result[0];

                    $.mobile.changePage("#index");

                }else{
                    $("#LogInFail").html("The password is wrong!");
                }
            }
        },
        error: function(error){
            $("#LogInFail").html("The user does not exist!");
        }
    });
}

function Logout(){
    currentUser=null;

    $.mobile.changePage("#LogIn");
}

var join = function(id){


    var query=new Parse.Query(Invitation);

    query.get(id,{
        success: function(results){
            var thisInvitation=results;

            if(currentUser.get("username")==results.get("issuer")){
                return;
            };

            var confirmJoin=confirm("You want to join "+thisInvitation.get("category")+" : "+thisInvitation.get("title")+" which lasts until "+thisInvitation.get("LastUntil")+" with "+thisInvitation.get("issuer")+" ?");

            if(!confirmJoin){return;}

            thisInvitation.addJoiner(currentUser);

            thisInvitation.save({
                success: function(thisInvitation){


                    var Issuer;

                    var queryForIssuer=new Parse.Query(player);
                    queryForIssuer.equalTo("username",thisInvitation.get("issuer"));

                    queryForIssuer.find({
                        success: function(userResults){


                            Issuer=userResults[0];

                            //socket.emit("action",{joiner: curentUser.get("username"),owner: Issuer.get("username"),category:thisInvitation.get("category"),title: thisInvitation.get("title")});

                            Issuer.addNotification(currentUser , "You invitation "+thisInvitation.get("title")+" is joined by "+ currentUser.get("username") );
                        }
                    });


                },
                error: function(error){
                    console.log("Error save the user "+error);
                }
            });

        }
    });
}


var startChat= function(user){
    if(currentUser.get("username")==user){
        return;
    }

    $("#LeaveMessageTitle").html("Leave Message to "+user);

    $("#LeaveMessageSubmit").click(function(){
        if(! $("#LeaveMessageInput").val()){
            return;
        }

        var userToSend;

        var query=new Parse.Query(player);
        query.equalTo("username",user);

        query.find({
            success: function(results){
                userToSend=results[0];


                userToSend.addNotification(currentUser,$("#LeaveMessageInput").val());
            },
            error: function(error){
                console.log("Failed to get user "+error);
            }
        });



        $.mobile.changePage("#index");
    });

    $.mobile.changePage("#LeaveMessage");
}

function reply(username,i){
    var userToSend;

    var query=new Parse.Query(player);
    query.equalTo("username",username);

    query.find({
        success: function(results){
            userToSend=results[0];

            userToSend.addNotification(currentUser,$("#notice"+i).val());
        },
        error: function(error){
            console.log("Failed to get user "+error);
        }
    });

}

function GetDirection(Lat,Lng){
    GMaps.geolocate({
        success: function(position){
            map.drawRoute({
                origin: [position.coords.latitude, position.coords.longitude],
                destination: [Lat, Lng],
                travelMode: 'walking',
                strokeColor: '#131540',
                strokeOpacity: 0.6,
                strokeWeight: 6
            });
        }
    })
};

function getDetails(id){
    var query=new Parse.Query(Invitation);

    query.get(id,{
        success: function(result){
            $("#InvitationDetailCheck h2").html("Details of "+result.get("title"));

            $("#InvitationDetailCheck button").click(function(){
               if($("#ChannelInput").val()){
                   var queryUser;

                   queryUser=new Parse.Query(player);
                   queryUser.equalTo("username",result.get("issuer"));

                   queryUser.find({
                       success:function(results){
                           queryUser=results[0];
                           queryUser.addNotification(currentUser,"The channel number to start video is "+ $("#ChannelInput").val());

                           if(queryUser.get("connected")){
                               var con="<h2>Name: "+queryUser.get("name")+"</h2>"+
                                   "<p>username: "+queryUser.get("username")+"</p>"+
                                   "<p>gender: "+queryUser.get("gender")+"</p>"+
                                   "<p>Email: "+queryUser.get("email")+"</p>"+
                                   '<p>Facebook : <a href="'+queryUser.get("linkToFacebook")+'">'+queryUser.get("linkToFacebook")+'</a></p>';

                               $("#userProfileData").html(con);
                           }
                       }
                   })


               }
            });

            $("#ChannelInput").keydown(function(event){
                if(event.which == 13){
                    $("#InvitationDetailCheck button").click();
                }
            })

            $.mobile.changePage("#InvitationDetailCheck")
        }
    })
}
