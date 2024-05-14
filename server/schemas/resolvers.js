const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express'); 
const resolvers = {
  Query: {
    users: async () => {
      return User.find();
    },
    user: async (parent, { username }) => {
      return User.findOne({ username });
    },

    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
    myBooks: async (parent, args, context) => {
      if (context.user) {
        try {
          const user = await User.findById(context.user._id).populate('books');
          if (!user) {
            throw new Error('User not found.');
          }
    
          return user.savedBooks;
        } catch (error) {
          throw new Error(`Error fetching books: ${error.message}`);
        }
      }
      throw new AuthenticationError('User not authenticated');
    },
  },
  Mutation: {
    addUser: async (_, { username, email, password }) => {
      try {
        const user = await User.create({ username, email, password });
    
        if (!user) {
          throw new Error('Failed to create user');
        }
    
        console.log('New user created:', user);
        return { token: signToken(user), user };
      } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
      }
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (_, { book }, { user }) => {
      if (!user) {
        throw new AuthenticationError('User not authenticated');
      }
    
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { savedBooks: book } },
        { new: true }
      );
    
      console.log('Updated user:', updatedUser); 
    
      return updatedUser;
    },
    removeBook: async (parent, { id, bookId }) => {
      return User.findOneAndUpdate(
        { _id: id },
        { $pull: { savedBooks: { _id: bookId } } },
        { new: true }
      );
    },
  }
};

module.exports = resolvers;
