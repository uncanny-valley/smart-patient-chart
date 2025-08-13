## Smart Patient Chart

### Stack
- **Frontend**: React 18, Vite
- **Data**: Apollo Client, GraphQL, Healthie API
- **Styling**: Tailwind CSS

## Quick start
### Install
```bash
yarn install
```
### Configure environment
Create a `.env.local` in the project root:
```bash
VITE_HEALTHIE_API_KEY=<your Healthie Basic auth string>
```

### Develop
```bash
yarn dev
```
- Visit `http://localhost:3000`

### Productionalize
`yarn build`, which creates a build in `dist/`


### Project structure
- `src/main.jsx`: App entry; Apollo Client setup and auth link
- `src/App.jsx`: Patient directory with table and modal launcher
- `src/components/DynamicTable.jsx`: Generic table component to search, sort, and paginate
- `src/components/PatientOverview.jsx`: Tabs for Overview, Medical, Nutrition, Appointments
- `src/queries/healthieQueries.js`: GraphQL operations
- `src/utils/quickNotesParser.js`: Parse/format `quick_notes` HTML for a Healthie user

### Configuration notes
- Default GraphQL endpoint: Healthie staging at `https://staging-api.gethealthie.com/graphql` (see `src/main.jsx`).
- Tailwind is preconfigured via `tailwind.config.js` and `postcss.config.js`.

