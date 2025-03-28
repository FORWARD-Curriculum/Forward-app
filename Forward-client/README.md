# Frontend Notes

[Back to Main Docs](../README.md)

## Intro

The frontend is built on [React Router](https://reactrouter.com/home) as a framework, [Redux](https://redux.js.org/) for application state, [tailwindcss](https://tailwindcss.com/) for styling, [shadcn](https://ui.shadcn.com/) for some component scaffolding, and [Vite](https://vite.dev/) as the bundler.

In development, `npm run dev` starts a development server with Vite's sourcemapping enabled for debugging.

In production `npm run build` builds and bundles the entire application into an SPA app, which in its entirety may be deployed to a public facing S3 bucket. Note that because ReactRouter manages routing through the browser API, the 'error document' in S3 (404: Not Found) should point back to the generated index.html file to make the app work as expected.

## Todos

- Rework activities to send partial response data on leave OR periodically send partial respoinse data.
- Ping server on firstload if user logged in to check for stale session
- Fully interface backend with userResponseData api
- Add definition activity type

## Important Notes

- When accessing any data on load from the backend RR's [Route.clientLoader](https://reactrouter.com/start/framework/data-loading#client-data-loading) function should be used to simultaneously load the route and page data, as fetching within the default function can create long network waterfalls and out of date data.

- While it is yet to be implemented the `apiFetch()` function from [app/lib/utils](./app/lib/utils.ts) wraps the builtin `fetch()` function with the required CSRF headers to authenticate the request to the server.

- shadcn provides a useful feedback component called a [Sonner](https://ui.shadcn.com/docs/components/sonner) ([Docs](https://sonner.emilkowal.ski/)), most importantly, the Sonner component provides a global Toast. We can take advantage of this to provide feedback to the user such as:

  - `toast.error()`
  - `toast.success()`
  - `toast()`

- Always use the `<Link prefetch="intent">` components when linking to pages from **FORWARD**. Due to the nature of the project, you should never use an `<a>` tag because linking to external sites is explicity against the security requirements.

- The user authentication state is stored in the LocalStorage of each user's browser as a stringified [User](./app/lib/userSlice.ts) object. This is rechecked on each route update, however as above, please keep in mind that secure information distribution should **_ALWAYS_** originate from the source of truth backend via an authenticated API call.

- React Router (RR) lets us define routes and layouts for our project in [one file](./app/routes.ts). Generally, there is a global layout that provides a Header and Footer to every page on the site (that is not a 404 for the time being). Any routes that require general user authentication, for the sake of UX should be defined as a subroute of the `protected.tsx` layout. This will automatically redirect users that are not logged in to the login/registration page.

  > [!WARNING]
  > While the user is redirected from protected routes, this is a client side check, and so any secure information should always be retrieved via an authenticated API call.

- Everything should be strongly typed via TypeScript to ensure no data disparity between components, and if possible, every non-component function meant for general consumption should have a [JSDoc](https://jsdoc.app/) description for inline documentation. If time allows, defining types with both TypeScript and the `@param` tag in JSDoc is preferred.

- Application state is managed via Redux. High level objects to store data are managed in 'slices' which have a set of pure reducers. Some more Redux notes:
  - To subscribe to immutable state through the redux store, I reccomend using the pattern:
    ```javascript
      const someState = useSelector((state: RootState)=>state.path.to.someState);
    ```
  - For type safety, use `dispatch(someReducer({payload}))` instead of the often seen `dispatch({type: 'someSlice/someReducer', payload: {payload} })`. This enforces the payload type matches the reducer's expected payload type.
  - When updating the store with data fetched via a `clientLoader`, always ***only*** update the store in a `useEffect` with the dependency being the `loaderData` object recieved from the `Route.ComponentProps`. If you instead try to update the store on component mount, the loaderData is possibly an unresolved promise.
  - User responses are handled with a "catch all" `saveUserResponseThunk`, which takes a response type, and response object. This posts to the server with the nessecary data, and only updates the store on a 200 OK back.

- Styling is done with tailwindcss for a standardized application state. Using the power of CSS variables, this means that any logic involving theming and font size can be reduced to using the app's predefined colors. Here are those colors and their usecases:
  <details>
    <summary>Colors (With descriptions relating to default theme)</summary>  

    - `background` - Basic background color.
    - `foreground` - Basic foreground color.
    - `primary` - The iconic cyan-blue of forward, often used as a background.
    - `primary-foreground` - A white to stand out against `primary` for text.
    - `primary-border` - Same color as `primary`, but different in high-contrast theme to add contextual borders to elements that may lose context from normal styling.
    - `secondary` - Similar to foreground as a background color to stand out from the `background` color.
    - `secondary-foreground` - A black to stand out against `secondary` for text.
    - `secondary-border` - Same color as `secondary`, but different in high-contrast theme to add contextual borders to elements that may lose context from normal styling.
    - `accent` - For the orange elements, as a background. For text, use `primary-foreground`
    - `muted` - A muted background color.
    - `muted-foregorund` - A gray to stand out against `muted`for text.
    - `error` - A red background color.
    - `error-foregorund` - A white to stand out against `error`for text.
  </details>

  Text is the same as normal tailwind styling.

<details>
<summary>React Router Included README</summary>

# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

This template includes three Dockerfiles optimized for different package managers:

- `Dockerfile` - for npm
- `Dockerfile.pnpm` - for pnpm
- `Dockerfile.bun` - for bun

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# For pnpm
docker build -f Dockerfile.pnpm -t my-app .

# For bun
docker build -f Dockerfile.bun -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

</details>
