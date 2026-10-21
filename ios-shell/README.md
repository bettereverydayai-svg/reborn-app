# Reborn Rising iPhone shell

Built web files (`www/`, the STORE=1 store build) plus the Capacitor iOS project. No app source lives here;
the source of record stays private in the project files. Built by `.github/workflows/ios-testflight.yml`
on GitHub's Mac machine and sent to TestFlight. Secrets are only in encrypted repository secrets.

To refresh: replace `www/` with a new STORE=1 build, then run the workflow.
Watch data: Apple Health (HealthKit), read only: steps, calories burned, heart rate, weight.
