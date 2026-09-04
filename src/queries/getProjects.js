import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      nodes {
        id
        title
        content
      }
    }
  }
`;