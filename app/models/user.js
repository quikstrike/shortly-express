var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  initialize: function(){
    this.on('creating', function(model, attrs, options){
      var newPass = bcrypt.hashSync(model.get('password')); //synchronous
      model.set('password',newPass) //set hashed password as password
    });
  }
});



module.exports = User;
