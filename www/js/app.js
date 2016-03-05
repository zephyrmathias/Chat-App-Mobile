// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

var firebaseRef = new Firebase("https://zephyrchat.firebaseio.com/");
angular.module('chat', ['ionic','firebase','ngCordova','btford.socket-io','chat.controllers', 'chat.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })
  .state('tab.dashboard', {
    url: '/dashboard',
    views: {
      'tab-dashboard': {
          templateUrl: 'templates/dashboard.html',
          controller: 'DashboardCtrl'
      }
    }
  })
  .state('tab.chats', {
    url: '/chats',
    views: {
      'tab-chats': {
          templateUrl: 'templates/chats.html',
          controller: 'ChatsCtrl'
      }
    }
  })
  .state('tab.chat-detail', {
    url: '/chats/:roomId',
    views: {
      'tab-chats': {
        templateUrl: 'templates/chat-detail.html',
        controller: 'ChatDetailCtrl'
      }
    }
  })
  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
          templateUrl: 'templates/account.html',
          controller: 'AccountCtrl'
      }
    }
  })

  .state('introduction', {
    url: '/introduction',
    templateUrl: 'templates/introduction.html',
    controller: 'IntroductionCtrl'
  })
  .state('sign-in',{
    url: '/sign-in',
    templateUrl: 'templates/sign-in.html',
    controller: 'SignInCtrl'
  })
  .state('sign-up',{
    url: '/sign-up',
    templateUrl: 'templates/sign-up.html',
    controller: 'SignUpCtrl'
  })
  
  $urlRouterProvider.otherwise("/introduction");
})
