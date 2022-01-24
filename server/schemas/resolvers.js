const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenicationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        // get one user by either their username or their user ID
        me: async (parent, args, context) => {
            if (context.user) {
                const findUser = await User.findOne({ _id: context.user._id })
                .select('-__v -password');
                return findUser;
            }

            throw new AuthenicationError('You are not currently logged in!');
        },
    },
    Mutation: {
        // allows creation of users, auth token and return
        addUser: async(parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        // log the user in
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email: email });

            if (!user) {
                throw new AuthenicationError('Invalid login credentials! Please try again!');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenicationError('Invalid password! Please try again!');
            }

            console.log('Successful login');

            const token = signToken(user);

            return { token, user };
        },

        // save a book to the logged in user's saved book shelf
        saveBook: async (parent, { book }, context) => {
            if (context.user) {
                const updateUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: { ...book }}},
                    { new: true, runValidators: true }
                );
                return updateUser;
            }

            throw new AuthenicationError('You need to be logged in!');
        },
        // allow the user to remove books from their savedBook
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updateUser = await User.findOneAndUpdate(
                    { id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId }}},
                    { new: true }
                );

                return updateUser;
            }
            throw new AuthenicationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;