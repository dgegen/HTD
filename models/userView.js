// models/userViews.js

// 'use strict';
const { DataTypes, Model } = require('sequelize');


module.exports = (sequelize) => {
  class UserViews extends Model {
    static associate(models) {
      // Define a many-to-one association with the User model
      UserViews.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    }
  }

  UserViews.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the user who viewed the image',
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the image that was viewed',
      },
      view_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Order of the view for the user',
      },
    }, {
      sequelize,
      modelName: 'UserViews',
      timestamps: false,      
    }
  );

  return UserViews;
};
