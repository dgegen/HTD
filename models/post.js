// models/post.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      // Define associations here if needed
      // Example: If multple Post belongs to a User
      Post.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  Post.init(
    {
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      time: {
        type: DataTypes.FLOAT, // Adjust the data type accordingly
        allowNull: true,
      },
      certainty : {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Post', // Adjust the model name accordingly
      timestamps: false, // Exclude timestamps
    }
  );

  return Post;
};
