var sequelize = require("sequelize");
const { User, Post } = require("../models"); // Assuming your models are exported this way

async function getTopUsersWithMostPosts() {
    try {
      const topUsers = await User.findAll({
        attributes: ['id', 'username'],
        include: [
          {
            model: Post,
            attributes: [], // Include at least one attribute of the Post model
            duplicating: false
          }
        ],
        group: ['User.id'],
        order: [[sequelize.literal('COUNT(posts.id)'), 'DESC']],
        limit: 10
      });
  
      // Manually count the number of posts for each user
      const topUsersWithCounts = await Promise.all(topUsers.map(async user => {
        const postCount = await Post.count({ where: { user_id: user.id } });
        return {
          id: user.id,
          username: user.username,
          postCount: postCount
        };
      }));
  
      return topUsersWithCounts;
    } catch (error) {
      console.error('Error fetching top users:', error);
      throw error;
    }
  }
    
// Usage
getTopUsersWithMostPosts()
  .then(topUsers => {
    console.log('Top 10 users with the most posts:');
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}, Username: ${user.username}, Post Count: ${user.postCount}`);
    });
  })
  .catch(error => {
    // Handle error
  });


module.exports = getTopUsersWithMostPosts;