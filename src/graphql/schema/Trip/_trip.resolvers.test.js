describe('schema', () => {
  test('has valid type definitions', async () => {});
});

describe('destination', () => {
  test('it should return the destination name', async () => {
    expect(trip.name).toEqual('My beautiful trip');
    expect(trip.name).not.toBeNull();
  });
  test('it should return the trip when we call the trip with id', async () => {
    expect(trip.id).toEqual('5c06915e941973842e60d8d8');
    expect(trip.id).toHaveLength(24);
  });
  test('it should find the user.id of the participant in an array', async () => {
    expect(trip.participants[0]).toContain('000000000000000000000000');
    expect(trip.participants[0]).toHaveLength(24);
    expect(trip.participants).not.toBeNull();
  });
  test('a timeframe suggestion must have a start date and an end date', async () => {
    expect(trip.timeFrame.suggestions[0].startDate).toBeDefined();
    expect(trip.timeFrame.suggestions[0].endDate).toBeDefined();
    expect(trip.timeFrame.suggestions[0].endDate).toEqual(
      '2018-12-23T00:00:00Z'
    );
    let dateFormat = trip.timeFrame.suggestions[0].endDate.substring(0, 10);
    expect(dateFormat).toEqual('2018-12-23');
  });
  test('destination suggestion should contain a name and a creator', async () => {
    expect(trip.destination.suggestions[0].name).toBeDefined();
    expect(trip.destination.suggestions[0].name).toEqual('Barcelona');
    expect(trip.destination.suggestions[0].creator).toHaveLength(24);
    expect(trip.destination.suggestions[0].creator).toBeDefined();
    expect(trip.destination.suggestions[0].voters).toContain(
      '222222222222222222222222'
    );
  });
  test('a budget suggestion must be of a type number', async () => {
    expect(trip.budget.suggestions[0].value).toEqual(500);
    expect(trip.budget.isDictated).toBeDefined();
    expect(trip.budget.suggestions[0].creator).toHaveLength(24);
    expect(trip.budget.suggestions[0].creator).toBeDefined();
  });
  test('it should have a valid format creation date', async () => {
    let strDate = trip.createdAt.substring(0, 10);
    expect(strDate).toEqual('2018-12-04');
    expect(trip.createdAt).not.toBeNull();
  });
});

const trip = {
  id: '5c06915e941973842e60d8d8',
  name: 'My beautiful trip',
  participants: ['000000000000000000000000', '333333333333333333333333'],
  creator: '222222222222222222222222',
  destination: {
    isDictated: false,
    suggestions: [
      {
        voters: ['222222222222222222222222', '000000000000000000000000'],
        _id: '000000000000000000000000',
        name: 'Barcelona',
        creator: '222222222222222222222222'
      }
    ]
  },
  budget: {
    isDictated: false,
    suggestions: [
      {
        voters: ['333333333333333333333333', '444444444444444444444444'],
        _id: '000000000000000000000000',
        value: 500,
        creator: '333333333333333333333333'
      }
    ]
  },

  timeFrame: {
    isDictated: true,
    chosenTimeFrame: '000000000000000000000000',
    suggestions: [
      {
        voters: ['111111111111111111111111', '444444444444444444444444'],
        _id: '000000000000000000000000',
        startDate: '2018-12-16T00:00:00Z',
        endDate: '2018-12-23T00:00:00Z',
        creator: '111111111111111111111111'
      },
      {
        voters: ['111111111111111111111111', '444444444444444444444444'],
        _id: '111111111111111111111111',
        startDate: '2018-12-16T00:00:00Z',
        endDate: '2018-12-23T00:00:00Z',
        creator: '444444444444444444444444'
      }
    ]
  },
  createdAt: '2018-12-04T13:09:20.493Z'
};
