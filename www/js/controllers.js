angular.module('chat.controllers', [])

.controller('IntroductionCtrl', function($scope){

})

.controller('SignInCtrl', function($scope, $rootScope, Spinner, Auth, $firebase, $ionicHistory, $state, $ionicPopup){

  $scope.user = {
    email: '',
    password:''
  };

  $scope.signIn = function(user) {
    $rootScope.show('Logging In ....');
    if(!user.email || !user.password) {
      $rootScope.hide();
      $rootScope.notify('Error', 'Email or Password is Incorrect !');
      return;
    }

    Auth.$authWithPassword({
      email: user.email,
      password: user.password
    })
    .then(function(authData){
      $rootScope.hide();
      Materialize.toast('Successfully Logged In', 4000);
      $state.go('tab.dashboard');
    })
    .catch(function(error){
      $rootScope.hide();
      $rootScope.notify('Error', 'Email or Password is Incorrect !');
    });
  };

  $scope.resetPopup = function(){
    $rootScope.showPopup();
  };

  $rootScope.showPopup = function() {
    $rootScope.forgot = {}
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input type="email" ng-model="forgot.email">',
      title: 'Enter Email',
      subTitle: 'New Password Will Be Sent To Your Email',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$rootScope.forgot.email) {
              //don't allow the user to close unless he enters wifi password
              e.preventDefault();
            } else {
              $scope.resetPassword($rootScope.forgot.email);
            }
          }
        }
      ]
    });
  };

  $scope.resetPassword = function(email) {
    $rootScope.show('Resetting Password...');
    firebaseRef.resetPassword({
      email: email
    }, function(error) {
      if (error) {
        switch (error.code) {
          case "INVALID_USER":
            $rootScope.hide();
            $rootScope.notify('Error', 'The Specified Email Does Not Exist');
            break;
          default:
            $rootScope.hide();
            $rootScope.notify('Error', 'Cannot Reset Password.');
        }
      } else {
        $rootScope.hide();
        Materialize.toast('Password is Sent to Your Email', 4000);
      }
    });
  };

})

.controller('SignUpCtrl', function($scope, $rootScope, $state, $firebase, $firebaseAuth, Spinner, UserData){

  $scope.user = {
    email: '',
    password: '',
    display_name:''
  };

  $scope.createUser = function(user){
    var email = user.email;
    var password = user.password;
    var display_name = user.display_name;

    if(!email || !password || !display_name) {
      $rootScope.notify("Please Enter Valid Data");
      return false;
    }

    $rootScope.show('Register..');

    var authen = $firebaseAuth(firebaseRef);
    authen.$createUser(email,password).then(function(error){
      return authen.$authWithPassword({
        email: email,
        password: password
      });
    })
    .then(function(authData){
      /*JSON DATA FOR CREATING USER*/
      $scope.temp = {
        email: user.email,
        password: user.password,
        picture: '',
        display_name: user.display_name,
        status: '',
        created: Date.now()
      };
      /*SAVE PROFILE DATA TO FIREBASE*/
      var usersRef = UserData.ref();
      var myUser = usersRef.child(escapeEmailAddress(user.email));
      myUser.update($scope.temp, function(){
        Materialize.toast('Successfully Registered', 4000);
        $rootScope.hide();
        $state.go('sign-in');

      });
    })
    .catch(function(error){
      if(error.code == 'INVALID_EMAIL') {
        $rootScope.hide();
        $rootScope.notify('Error', 'Invalid Email !');
      }
      else if (error.code == 'EMAIL_TAKEN'){
        $rootScope.hide();
        $rootScope.notify('Error', 'Email Already Used.');
      }
      else {
        $rootScope.hide();
        $rootScope.notify('Error', 'Something Went Wrong.');
      }
    })
  };

})

.controller('DashboardCtrl', function($scope, $rootScope, $state, Spinner, UserData, Socket, $ionicPopover, $ionicScrollDelegate, $ionicModal,$ionicPlatform){

  $scope.$on('$ionicView.enter', function(){
    $rootScope.show('');
    UserData.getMyData().then(function(output){
      UserData.currentData = output;
      $rootScope.currentUser = UserData.currentData.currentUser;
      $rootScope.hide();
    });
  });

  $scope.doRefresh = function() {
      UserData.getMyData().then(function(output){
        UserData.currentData = output;
        $rootScope.currentUser = UserData.currentData.currentUser;
        $scope.$broadcast('scroll.refreshComplete');
      });
  }

  $rootScope.rooms = {};
  $rootScope.roster = [];
  $rootScope.usersInRoom = {};
  $rootScope.whoOnline = [];


  var authData = firebaseRef.getAuth();
  if(authData) {
    Socket.on('connect', function(){
      $scope.setName();
    });
  }

  Socket.on('Roster', function(users){
    $rootScope.roster = users;
    $scope.$apply();
  });

  $scope.setName = function() {
    $scope.user = {email:'',display_name:'',status:'',picture:''};
    $scope.user.email = $rootScope.currentUser.email;
    $scope.user.display_name = $rootScope.currentUser.display_name;
    $scope.user.status = $rootScope.currentUser.status;
    $scope.user.picture = $rootScope.currentUser.picture;
    Socket.emit('identify', $scope.user);
  };

  $scope.randomRoom = function(length, user) {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
    var roomid = "";
    for (var x = 0; x < length; x++) {
      var i = Math.floor(Math.random() * chars.length);
      roomid += chars.charAt(i);
    }
    $scope.roomId = roomid;
    var userAndRoom = {room:$scope.roomId,user:user,me:$rootScope.currentUser};
    Socket.emit('subscribe', userAndRoom);
    $rootScope.rooms[$scope.roomId] = [];
    $rootScope.usersInRoom[$scope.roomId] = [];
    $rootScope.whoOnline[$scope.roomId] = [];
  };

  $scope.roomId = '';

  Socket.on("Message", function(data){
    if($rootScope.rooms.hasOwnProperty(data.roomId)) {
      $rootScope.rooms[data.roomId].push(data);
    }
    else {
      $rootScope.rooms[data.roomId] = [];
      $rootScope.rooms[data.roomId].push(data);
    }
    $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
  });

  Socket.on("UsersInRoom", function(data){
    if($rootScope.usersInRoom.hasOwnProperty(data.roomId)) {
      $rootScope.usersInRoom[data.roomId] = data.whoOnline;
      $scope.$apply();
      var x = [];
      for (var i in data.whoOnline) {
        x.push(data.whoOnline[i].email);
      }
      $rootScope.whoOnline[data.roomId] = x;
    }
    else {
      $rootScope.usersInRoom[data.roomId] = [];
      $rootScope.usersInRoom[data.roomId] = data.whoOnline;
      $scope.$apply();
    }
  });

  $ionicModal.fromTemplateUrl('templates/addfriend.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.addFriendModal = modal;
  });

  $scope.addFriend = function() {
    $scope.addFriendModal.show();
  };

  $scope.hideAddFriendModal = function() {
    $scope.addFriendModal.hide();
  };
})

.controller('ChatsCtrl', function($scope, $rootScope, Socket){
  
})

.controller('ChatDetailCtrl', function($scope, $rootScope, $stateParams, Socket, $ionicPopover, $ionicModal){

  $scope.roomId = $stateParams.roomId;
  $scope.roomMsg = $rootScope.rooms[$scope.roomId];

  $scope.sendMessage = function(){
    if($scope.message.length == 0) return;
    var newMessage = {sender:'',email:'', picture:'', message:'',socketId:'',roomId:''};
    newMessage.sender = $rootScope.currentUser.display_name;
    newMessage.email = $rootScope.currentUser.email;
    newMessage.picture = $rootScope.currentUser.picture;
    newMessage.message = $scope.message;
    newMessage.socketId = $scope.socketId;
    newMessage.roomId = $scope.roomId;
    Socket.emit("Message", newMessage);
    $scope.message = '';
  }

  $ionicPopover.fromTemplateUrl('templates/popover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.demo = 'ios';
  $scope.setPlatform = function(p) {
    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.add('platform-' + p);
    $scope.demo = p;
  }

  $ionicModal.fromTemplateUrl('templates/addfriend.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.addFriendModal = modal;
  });

  $scope.openAddFriendModal = function() {
    $scope.addFriendModal.show();
  };

  $scope.hideAddFriendModal = function() {
    $scope.addFriendModal.hide();
  }

  $scope.addFriend = function(user, roomId) {
    var data = {user: user, roomId: roomId};
    Socket.emit("addFriend", data);
    Materialize.toast(user.display_name + ' Has Been Added.', 4000);
    $scope.addFriendModal.hide();
  }

  $scope.kick = function(user,roomId) {
    var data = {user: user, roomId: roomId};
    Socket.emit("unsubscribe", data);
    Materialize.toast(user.display_name + ' Has Been Removed.', 4000);
    $scope.addFriendModal.hide();
  }


})

.controller('AccountCtrl', function($scope, $rootScope, $state, UserData, $timeout, Spinner, $ionicHistory, Socket, Auth, $ionicModal){
  $scope.$on('$ionicView.enter', function(){
    $rootScope.show('');
    UserData.getMyData().then(function(output){
      UserData.currentData = output;
      $rootScope.currentUser = UserData.currentData.currentUser;
      $rootScope.hide();
    });
  });

  $scope.logout = function() {
    $rootScope.show('Logging Out...');
    UserData.clearData();
    $ionicHistory.clearCache();
    Auth.$unauth();
    Socket.disconnect();
    $timeout(function(){
      $rootScope.hide();
      $state.go('introduction');
    },2500);
  };

  $scope.editDisplay = function() {
    $scope.modalDisplayName.show();
  }

  $ionicModal.fromTemplateUrl('templates/editDisplay.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.modalDisplayName = modal;
  });

  $ionicModal.fromTemplateUrl('templates/editStatus.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.modalStatus = modal;
  });

  $scope.editStatus = function() {
    $scope.modalStatus.show();
  }
            
  $scope.cancelModalDisplayName = function() {
    $scope.modalDisplayName.hide();
  };

  $scope.cancelModalStatus = function() {
    $scope.modalStatus.hide();
  };

  $scope.saveDisplayName = function(displayName){
    $rootScope.show('Saving...');
    var displayName = displayName;
    if(!displayName) {
      $rootScope.hide();
      return;
    }
    /*PREPARE DATA*/
    var newData = {
      display_name: displayName,
    }
    var usersRef = firebaseRef.child("users/"+escapeEmailAddress($rootScope.currentUser.email));
    usersRef.update(newData, function(error){
      if(error){

      }
      else {
        $rootScope.hide();
        UserData.getMyData().then(function(output){
          UserData.currentData = output;
          $rootScope.currentUser = UserData.currentData.currentUser;
          $rootScope.hide();
        });
        $scope.modalDisplayName.hide();
      }
    })
  };

  $scope.saveStatus = function(status){
    $rootScope.show('Saving...');
    var status = status;
    if(!status) {
      $rootScope.hide();
      return;
    }
    /*PREPARE DATA*/
    var newData = {
      status: status,
    }

    var usersRef = firebaseRef.child("users/"+escapeEmailAddress($rootScope.currentUser.email));
    usersRef.update(newData, function(error){
      if(error){

      }
      else {
        $rootScope.hide();
        UserData.getMyData().then(function(output){
          UserData.currentData = output;
          $rootScope.currentUser = UserData.currentData.currentUser;
          $rootScope.hide();
        });
        $scope.modalStatus.hide();
      }
    })
  };

  $ionicModal.fromTemplateUrl('templates/imageupload.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.pictureModal = modal;
  });

  $scope.editPicture = function() {
    $scope.pictureModal.show();
  }
            
  $scope.cancelImageModal = function() {
    $scope.pictureModal.hide();
  };

  $scope.saveImage = function(imageUrl){
    $rootScope.show('Saving...');
    var imageUrl = imageUrl;
    if(!imageUrl) {
      $rootScope.hide();
      return;
    }
    /*PREPARE DATA*/
    var newData = {
      picture: imageUrl,
    }

    var usersRef = firebaseRef.child("users/"+escapeEmailAddress($rootScope.currentUser.email));
    usersRef.update(newData, function(error){
      if(error){

      }
      else {
        $rootScope.hide();
        UserData.getMyData().then(function(output){
          UserData.currentData = output;
          $rootScope.currentUser = UserData.currentData.currentUser;
          $rootScope.hide();
        });
        $scope.pictureModal.hide();
      }
    })
  };


})

function escapeEmailAddress(email) {
  if(!email) return false;
  email = email.toLowerCase();
  email = email.replace(/\./g, ',');
  return email;
}

function unescapeEmailAddress(email) {
  if (!email) return false;
  email = email.toLowerCase();
  email = email.replace(/\,/g, '.');
  return email;
}

