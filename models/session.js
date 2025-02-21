// models/session.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // define association here
    }
  }

  Session.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
    },
    expires_at: {
        type: DataTypes.DATE,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Session',
    timestamps: false, // Disable automatic timestamps    
  });

  // Insert a new session
  Session.createSession = async function(sessionID, userID, expirationTime) {
    await this.create({
        id: sessionID,
        user_id: userID,
        expires_at: expirationTime,
    });
  };

  // Validate a session ID
  Session.isValidSessionID = async function(sessionID) {
    const session = await this.findOne({
        where: {
            id: sessionID,
            expires_at: {
                [sequelize.Op.gt]: new Date(),
            },
        },
    });

    return !!session;
  };

  return Session;
};
