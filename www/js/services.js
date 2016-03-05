angular.module('chat.services', [])

.factory('Spinner', function($rootScope, $ionicPopup, $ionicLoading){

	$rootScope.show = function(text){
		$rootScope.loading = $ionicLoading.show({
			template: '<ion-spinner icon="spiral" class="spinner-light"></ion-spinner><br>' + text,
	        animation: 'fade-in',
	        showBackdrop: false,
	        maxWidth: 200,
	        showDelay: 0
		});
	};

	$rootScope.hide = function() {
		$ionicLoading.hide();
	};

	$rootScope.notify = function(title,text) {
    	var alertPopup = $ionicPopup.alert({
     		title: title ? title : 'Error',
      		template: text,
      		showBackdrop: true
    	});
  	};
  	return {}
})

.factory('UserData', function($firebase, $rootScope, $q){
	var currentData = {
		currentUser: false
	};
	var ref = firebaseRef.child("users");
	return {
		ref: function(){
			return ref;
		},

		getMyData: function() {
			var output = {};
			var deferred = $q.defer();
			var authData = firebaseRef.getAuth();
			if (authData) {
				var usersRef = firebaseRef.child("users/"+escapeEmailAddress(authData.password.email));
				usersRef.once("value", function(snap){
					output.currentUser = snap.val();
					deferred.resolve(output);
				});
			}
			else {
				output = currentData;
				deferred.resolve(output);
			}
			return deferred.promise;
		},

		clearData: function() {
			currentData: false;
		}
	}
})

.factory('Auth', function($firebaseAuth, $rootScope){
  return $firebaseAuth(firebaseRef);
})

.factory('Socket', function(socketFactory){
  var myIoSocket = io.connect('https://zephyrchat-zephyrmathias.c9.io/');
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
})
