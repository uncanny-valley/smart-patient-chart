import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import App from './App.jsx'
import './index.css'

const httpLink = createHttpLink({
  uri: 'https://staging-api.gethealthie.com/graphql',
})

const authLink = setContext((_, { headers }) => {
  const apiKey = import.meta.env.VITE_HEALTHIE_API_KEY
  
  return {
    headers: {
      ...headers,
      authorization: apiKey ? `Basic ${apiKey}` : '',
      AuthorizationSource: 'API',
    }
  }
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
) 