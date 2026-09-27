# Deployment checklist

Fill in and check off as you actually do each step — don't check a box you
haven't done; the checklist is evidence, not decoration.

- [ ] `npm run build` succeeds locally with no errors
- [ ] `npm test` passes locally (9/9)
- [ ] Repo pushed to GitHub, `main` branch clean
- [ ] Netlify site created and connected to the GitHub repo
- [ ] Build command set to `npm run build`, publish directory `dist`
      (already configured in `netlify.toml` — Netlify should pick this up
      automatically)
- [ ] `ANTHROPIC_API_KEY` added under Site configuration → Environment
      variables (never committed to the repo)
- [ ] First deploy succeeds — check the Deploys tab for a green build
- [ ] Live URL loads over HTTPS (padlock in the address bar)
- [ ] Manually tested on the live URL: empty submit, garbage input, a real
      set of notes, and one deliberate API failure (e.g. temporarily rename
      the env var to confirm the error state renders correctly, then rename
      it back)
- [ ] Lighthouse (mobile) run against the live URL — scores recorded in
      `AUDIT.md`
- [ ] WAVE run against the live URL — results recorded in `AUDIT.md`
- [ ] Rollback plan confirmed: opened the Deploys tab once and located the
      "Publish deploy" button on a prior build, so it's not unfamiliar in an
      actual emergency

## Monitoring

No dedicated monitoring service is set up (out of scope for this size of
project). The practical monitoring is: Netlify's own deploy notifications
(email on failed build) plus manually checking the live URL after each
deploy. If this app grew beyond a class project, the next step would be a
free tier of Sentry or Netlify's own function logs for the AI-call error
rate.
