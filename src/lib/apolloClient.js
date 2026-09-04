import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'http://faisal.weballly.com/graphql', // নিশ্চিত করুন LocalWP এ সাইটটি চালু আছে
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});