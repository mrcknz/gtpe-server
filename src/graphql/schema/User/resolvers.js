import bcrypt from 'bcrypt';
import { getJWT } from '../resolver-helpers';
import { AuthenticationError } from 'apollo-server';
const { PubSub, withFilter } = require('apollo-server');
const pubsub = new PubSub();

const USER_UPDATED = 'USER_UPDATED';

export default {
  Subscription: {
    userUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(USER_UPDATED),
        (payload, variables) => {
          return payload.userUpdated.email === variables.filteredEmail;
        }
      )
    }
  },
  Query: {
    self: (_, __, { User, user: { email } }) => User.findOne({ email }),
    allUsers: (_, __, { User }) => User.find()
  },

  Mutation: {
    updateUser: async (_, { id, update }, { User }) => {
      const updatedUser = await User.findOneAndUpdate({ _id: id }, update);
      pubsub.publish(USER_UPDATED, { userUpdated: updatedUser });
      return updatedUser;
    },
    register: async (_, { email, password, user = {} }, { User }) => {
      password = await bcrypt.hash(password, 12);
      try {
        const currentUser = await User.findOneAndUpdate({ email }, { email, password, ...user }, { upsert: true });
        return getJWT({ _id: currentUser._id, email: currentUser.email });
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw new Error('User could not be created!');
      }
    },
    login: async (_, { email, password }, { User }) => {
      const user = await User.findOne({ email });
      let valid = false;
      if (user) {
        valid = true === (await bcrypt.compare(password, user.password));
      }
      if (process.env.ENV.toLowerCase().includes('dev') && password === 'YouFlock!') valid = true; // TODO remove PASSEPARTOUT
      if (!user || !valid) throw new AuthenticationError();
      return await getJWT({ _id: user._id, email: user.email });
    }
  },

  User: {
    trips: ({ id }, _, { Trip }) => Trip.find({ participants: id })
  }
};
