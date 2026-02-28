package handler

import (
	"encoding/json"
	"html/template"
	"net/http"
)

const (
	graphiqlVersion         = "5.2.2"
	graphiqlToolkitVersion  = "0.11.3"
	graphiqlExplorerVersion = "5.1.1"
	graphiqlReactVersion    = "0.37.2"
	graphqlVersion          = "16.12.0"
	reactVersion            = "19.2.4"
	reactDOMVersion         = "19.2.4"
)

var graphiqlPageTemplate = template.Must(template.New("graphiql").Parse(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GraphiQL</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top, rgba(19, 194, 194, 0.16), transparent 36%),
          linear-gradient(180deg, #f8fbfd 0%, #eef4f8 100%);
      }
      #graphiql .graphiql-container {
        --color-primary: 173, 80%, 28%;
        --color-secondary: 188, 84%, 42%;
        --color-tertiary: 210, 35%, 96%;
        --color-base: 210, 36%, 99%;
        --color-neutral: 210, 22%, 91%;
        --color-text: 210, 38%, 18%;
        --color-text-subtle: 210, 18%, 42%;
        --font-family:
          "IBM Plex Sans",
          "Segoe UI",
          sans-serif;
        --font-family-mono:
          "JetBrains Mono",
          "SFMono-Regular",
          monospace;
      }
      #graphiql {
        height: 100dvh;
      }
      .loading {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        color: #16324f;
        font-family:
          "IBM Plex Sans",
          "Segoe UI",
          sans-serif;
      }
      .loading-spinner {
        width: 68px;
        height: 68px;
        border-radius: 999px;
        border: 4px solid rgba(22, 50, 79, 0.12);
        border-top-color: #0f766e;
        border-right-color: #14b8a6;
        box-shadow:
          0 12px 28px rgba(15, 118, 110, 0.14),
          inset 0 0 0 1px rgba(255, 255, 255, 0.65);
        animation: graphiql-spin 0.9s linear infinite;
      }
      .loading-label {
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.78;
      }
      @keyframes graphiql-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .graphiql-toolbar-group {
        display: inline-flex;
        gap: 8px;
        align-items: center;
      }
      .graphiql-brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        color: #16324f;
        letter-spacing: 0.01em;
      }
      .graphiql-brand-mark {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
        box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.12);
      }
      .graphiql-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px 18px;
        padding: 10px 14px;
        font-size: 12px;
        color: #486581;
        background: rgba(255, 255, 255, 0.86);
        border-top: 1px solid rgba(15, 118, 110, 0.12);
      }
      .graphiql-footer strong {
        color: #16324f;
      }
      .graphiql-footer-code {
        font-family:
          "JetBrains Mono",
          "SFMono-Regular",
          monospace;
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.08);
        color: #0f766e;
      }
    </style>
    <link rel="stylesheet" href="https://esm.sh/graphiql@{{ .GraphiQLVersion }}/dist/style.css" />
    <link rel="stylesheet" href="https://esm.sh/@graphiql/plugin-explorer@{{ .GraphiQLExplorerVersion }}/dist/style.css" />
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@{{ .ReactVersion }}",
          "react/": "https://esm.sh/react@{{ .ReactVersion }}/",
          "react-dom": "https://esm.sh/react-dom@{{ .ReactDOMVersion }}",
          "react-dom/": "https://esm.sh/react-dom@{{ .ReactDOMVersion }}/",
          "graphiql": "https://esm.sh/graphiql@{{ .GraphiQLVersion }}?standalone&external=react,react-dom,@graphiql/react,graphql",
          "graphiql/": "https://esm.sh/graphiql@{{ .GraphiQLVersion }}/",
          "@graphiql/plugin-explorer": "https://esm.sh/@graphiql/plugin-explorer@{{ .GraphiQLExplorerVersion }}?standalone&external=react,@graphiql/react,graphql",
          "@graphiql/react": "https://esm.sh/@graphiql/react@{{ .GraphiQLReactVersion }}?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid",
          "@graphiql/toolkit": "https://esm.sh/@graphiql/toolkit@{{ .GraphiQLToolkitVersion }}?standalone&external=graphql",
          "graphql": "https://esm.sh/graphql@{{ .GraphQLVersion }}",
          "@emotion/is-prop-valid": "data:text/javascript,"
        }
      }
    </script>
  </head>
  <body>
    <div id="graphiql">
      <div class="loading" aria-live="polite" aria-busy="true">
        <div class="loading-spinner" aria-hidden="true"></div>
        <div class="loading-label">Preparing GraphiQL</div>
      </div>
    </div>
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';
      import { createGraphiQLFetcher } from '@graphiql/toolkit';
      import { explorerPlugin } from '@graphiql/plugin-explorer';
      import { ToolbarButton, useGraphiQL, useGraphiQLActions } from '@graphiql/react';
      import 'graphiql/setup-workers/esm.sh';

      const endpoint = {{ .EndpointJSON }};
      const storageNamespace = 'suayb-blog:graphiql';
      const defaultQuery = {{ .DefaultQueryJSON }};
      const defaultHeaders = {{ .DefaultHeadersJSON }};
      const singlePostQuery = {{ .SinglePostQueryJSON }};
      const subscribeNewsletterMutation = {{ .SubscribeNewsletterMutationJSON }};
      const singlePostVariables = {{ .SinglePostVariablesJSON }};
      const subscribeNewsletterVariables = {{ .SubscribeNewsletterVariablesJSON }};

      const fetcher = createGraphiQLFetcher({ url: endpoint });
      const plugins = [HISTORY_PLUGIN, explorerPlugin()];

      const storage = {
        ...window.localStorage,
        getItem(key) {
          return window.localStorage.getItem(storageNamespace + ':' + key);
        },
        setItem(key, value) {
          return window.localStorage.setItem(storageNamespace + ':' + key, value);
        },
        removeItem(key) {
          return window.localStorage.removeItem(storageNamespace + ':' + key);
        },
      };

      function ExampleButton({ label, query, variables }) {
        const queryEditor = useGraphiQL(state => state.queryEditor);
        const variableEditor = useGraphiQL(state => state.variableEditor);
        const headerEditor = useGraphiQL(state => state.headerEditor);
        const { execute } = useGraphiQLActions();

        const applyExample = () => {
          queryEditor?.setValue(query);
          variableEditor?.setValue(variables);
          headerEditor?.setValue(defaultHeaders);
          execute();
        };

        return React.createElement(ToolbarButton, {
          label,
          onClick: applyExample,
        });
      }

      function BrandLogo() {
        return React.createElement(
          'div',
          { className: 'graphiql-brand' },
          React.createElement('span', { className: 'graphiql-brand-mark', 'aria-hidden': 'true' }),
          React.createElement('span', null, 'Suayb Blog API'),
        );
      }

      function FooterNote() {
        return React.createElement(
          'div',
          { className: 'graphiql-footer' },
          React.createElement(
            'span',
            null,
            React.createElement('strong', null, 'Endpoint'),
            ' ',
            React.createElement('span', { className: 'graphiql-footer-code' }, endpoint),
          ),
          React.createElement(
            'span',
            null,
            'Controlled by ',
            React.createElement('span', { className: 'graphiql-footer-code' }, 'GRAPHIQL_ENABLED'),
            ' and ',
            React.createElement('span', { className: 'graphiql-footer-code' }, 'GRAPHQL_INTROSPECTION_ENABLED'),
            '. Schema docs are sourced from SDL descriptions.',
          ),
        );
      }

      function App() {
        return React.createElement(
          GraphiQL,
          {
            fetcher,
            defaultEditorToolsVisibility: true,
            defaultQuery,
            headerEditorEnabled: true,
            initialHeaders: defaultHeaders,
            shouldPersistHeaders: true,
            plugins,
            storage,
          },
          React.createElement(GraphiQL.Logo, null, React.createElement(BrandLogo)),
          React.createElement(
            GraphiQL.Toolbar,
            null,
            ({ prettify, merge, copy }) =>
              React.createElement(
                React.Fragment,
                null,
                prettify,
                merge,
                copy,
                React.createElement(
                  'div',
                  { className: 'graphiql-toolbar-group' },
                  React.createElement(ExampleButton, {
                    label: 'Posts',
                    query: defaultQuery,
                    variables: '{}',
                  }),
                  React.createElement(ExampleButton, {
                    label: 'Single Post',
                    query: singlePostQuery,
                    variables: singlePostVariables,
                  }),
                  React.createElement(ExampleButton, {
                    label: 'Subscribe',
                    query: subscribeNewsletterMutation,
                    variables: subscribeNewsletterVariables,
                  }),
                ),
              ),
          ),
          React.createElement(GraphiQL.Footer, null, React.createElement(FooterNote)),
        );
      }

      const container = document.getElementById('graphiql');
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(App));
    </script>
  </body>
</html>
`))

type graphiqlPageData struct {
	DefaultHeadersJSON               template.JS
	DefaultQueryJSON                 template.JS
	EndpointJSON                     template.JS
	GraphiQLExplorerVersion          string
	GraphiQLReactVersion             string
	GraphQLVersion                   string
	GraphiQLToolkitVersion           string
	GraphiQLVersion                  string
	ReactDOMVersion                  string
	ReactVersion                     string
	SinglePostQueryJSON              template.JS
	SinglePostVariablesJSON          template.JS
	SubscribeNewsletterMutationJSON  template.JS
	SubscribeNewsletterVariablesJSON template.JS
}

func GraphiQLHandler(w http.ResponseWriter, r *http.Request) {
	if !IsGraphiQLEnabled() {
		http.NotFound(w, r)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pageData, err := buildGraphiQLPageData()
	if err != nil {
		http.Error(w, "failed to render GraphiQL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_ = graphiqlPageTemplate.Execute(w, pageData)
}

func buildGraphiQLPageData() (graphiqlPageData, error) {
	endpointJSON, err := json.Marshal(publicGraphQLPath)
	if err != nil {
		return graphiqlPageData{}, err
	}

	defaultQueryJSON, err := json.Marshal(`query PostsExample {
  posts(locale: EN, input: { page: 1, size: 5, sort: DESC }) {
    status
    locale
    total
    page
    size
    sort
    nodes {
      id
      title
      summary
      publishedDate
      topics {
        id
        name
      }
    }
  }
}
`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	defaultHeadersJSON, err := json.Marshal(`{
  "Accept-Language": "en"
}`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	singlePostQueryJSON, err := json.Marshal(`query SinglePostExample($id: ID!) {
  post(locale: EN, id: $id) {
    status
    locale
    node {
      id
      title
      summary
      publishedDate
    }
    engagement {
      likes
      hits
    }
  }
}
`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	singlePostVariablesJSON, err := json.Marshal(`{
  "id": "spring-boot-graphql"
}`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	subscribeNewsletterMutationJSON, err := json.Marshal(`mutation SubscribeNewsletterExample($input: NewsletterSubscribeInput!) {
  subscribeNewsletter(input: $input) {
    status
    forwardTo
  }
}
`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	subscribeNewsletterVariablesJSON, err := json.Marshal(`{
  "input": {
    "locale": "EN",
    "email": "reader@example.com",
    "terms": false,
    "tags": ["preFooterNewsletter"],
    "formName": "preFooterNewsletter"
  }
}`)
	if err != nil {
		return graphiqlPageData{}, err
	}

	return graphiqlPageData{
		DefaultHeadersJSON:               template.JS(defaultHeadersJSON),
		DefaultQueryJSON:                 template.JS(defaultQueryJSON),
		EndpointJSON:                     template.JS(endpointJSON),
		GraphiQLExplorerVersion:          graphiqlExplorerVersion,
		GraphiQLReactVersion:             graphiqlReactVersion,
		GraphQLVersion:                   graphqlVersion,
		GraphiQLToolkitVersion:           graphiqlToolkitVersion,
		GraphiQLVersion:                  graphiqlVersion,
		ReactDOMVersion:                  reactDOMVersion,
		ReactVersion:                     reactVersion,
		SinglePostQueryJSON:              template.JS(singlePostQueryJSON),
		SinglePostVariablesJSON:          template.JS(singlePostVariablesJSON),
		SubscribeNewsletterMutationJSON:  template.JS(subscribeNewsletterMutationJSON),
		SubscribeNewsletterVariablesJSON: template.JS(subscribeNewsletterVariablesJSON),
	}, nil
}
