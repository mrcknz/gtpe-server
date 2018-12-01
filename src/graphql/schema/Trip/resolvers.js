import { users, voters, creator, buildSuggestionsObj, findUserOrCreate } from '../resolver-helpers';
import { AuthenticationError, PubSub, withFilter } from 'apollo-server';
import { addOrVoteForTimeFrame } from '../../../controllers/trip.controller';
const pubsub = new PubSub();

export default {
  Subscription: {
    tripInfoChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('TRIPINFO_CHANGED'),
        async (payload, variables, { User, user: { email } }) => {
          const user = await User.findOne({ email });
          const payloadResolved = await payload.tripInfoChanged;
          const participants = payloadResolved.participants.map((participant) => participant.toString());
          return participants.includes(user._id.toString());
        }
      )
    }
  },

  Query: {
    trip: (_, { id }, { Trip }) => Trip.findOne({ _id: id }),
    allTrips: (_, __, { Trip }) => Trip.find()
  },

  Mutation: {
    addOrVoteForTimeFrame: async (_, { tripID, timeFrames }, { Trip, user }) => {
      return addOrVoteForTimeFrame(tripID, timeFrames, user, Trip);
    },
    voteForDestination: async (_, { tripID, destinationID }, { Trip, User, user: { email } }) => {
      const user = await User.findOne({ email });
      if (!user._id) throw new AuthenticationError('No valid user found based on authorization token provided.');
      return await Trip.findOneAndUpdate(
        { _id: tripID, 'destination.suggestions._id': destinationID },
        {
          $addToSet: { 'destination.suggestions.$.voters': user._id }
        },
        { new: true }
      );
    },
    createTrip: async (_, { trip }, { Trip, User, user }) => {
      if (!user) throw new AuthenticationError();
      const {
        destination = { isDictated: false },
        budget = { isDictated: false },
        timeFrame = { isDictated: false },
        participants
      } = trip;

      trip.participants = await findUserOrCreate(participants, User);
      trip.participants = [ user._id, ...trip.participants ];
      destination.suggestions = buildSuggestionsObj(destination.suggestions, user._id);
      budget.suggestions = buildSuggestionsObj(budget.suggestions, user._id);
      timeFrame.suggestions = buildSuggestionsObj(timeFrame.suggestions, user._id);
      trip['creator'] = user._id;
      const newTrip = Trip.create({
        ...trip,
        destination,
        budget,
        timeFrame
      });

      pubsub.publish('TRIPINFO_CHANGED', { tripInfoChanged: newTrip });
      return newTrip;
    },
    addParticipant: async (_, { tripID, participants }, { Trip, User }) => {
      participants = await findUserOrCreate(participants, User);
      const participant = [
        { _id: tripID },
        {
          $addToSet: {
            participants: { $each: participants }
          }
        },
        { new: true }
      ];
      const newTrip = Trip.findOneAndUpdate(...participant);
      pubsub.publish('TRIPINFO_CHANGED', { tripAdded: newTrip });
      return newTrip;
    },
    addDestination: (_, { tripID, destination }, { Trip }) => {
      let suggestion = destination.suggestions;
      let addSuggestion = [
        { _id: tripID },
        {
          $addToSet: {
            'destination.suggestions': { $each: suggestion }
          }
        },
        { new: true }
      ];
      const updatedTrip = Trip.findOneAndUpdate(...addSuggestion);
      pubsub.publish('TRIPINFO_CHANGED', { tripAdded: updatedTrip });
      return updatedTrip;
    }
  },

  Trip: {
    participants: ({ participants }, _, { User }) => users(participants, User),
    creator
  },
  DestinationObject: {
    chosenDestination: ({ chosenDestination, suggestions }) =>
      suggestions.find((destination) => String(chosenDestination) === String(destination._id)) || null
  },
  Destination: {
    voters,
    creator
  },
  BudgetObject: {
    chosenBudget: ({ chosenBudget, suggestions }) =>
      chosenBudget || suggestions.find((budget) => chosenBudget === budget._id)
  },
  Budget: {
    voters,
    creator
  },
  TimeFrameObject: {
    chosenTimeFrame: ({ chosenTimeFrame, suggestions }) =>
      chosenTimeFrame || suggestions.find((timeFrame) => chosenTimeFrame === timeFrame._id)
  },
  TimeFrame: {
    voters,
    creator
  }
};
