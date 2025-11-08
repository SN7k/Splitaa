
# Splitaa Admin Panel (Angular)


1. **Create a new Angular app**
   ```powershell
   npx @angular/cli new admin --routing --style=scss
   ```

2. **Go to your app folder**
   ```powershell
   cd admin
   ```

3. **Install dependencies**
   ```powershell
   npm install
   ```

4. **Start the development server**
   ```powershell
   ng serve
   ```

5. **Open the app in your browser**
   - Go to [http://localhost:4200](http://localhost:4200)

---


---

## Splitaa Admin Panel Pages Structure

```
src/
  app/
    dashboard/
      dashboard.component.html   # Dashboard page layout
      dashboard.component.scss   # Dashboard page styles
      dashboard.component.ts     # Dashboard page logic
    login/
      login.component.html       # Login page layout
      login.component.scss       # Login page styles
      login.component.ts         # Login page logic
    guards/
      auth.guard.ts              # Protects routes (connects login and dashboard)
    services/
      admin.service.ts           # Handles data for dashboard/login
```

Dashboard and Login are the main pages. The guard connects them by protecting access, and the service provides shared data/functions.
        dashboard.component.ts
      guards/
        auth.guard.ts
      login/
        login.component.html
        login.component.scss
        login.component.ts
      services/
        admin.service.ts
    
```

This is a typical structure for the Splitaa admin panel. Your code will mostly go in the `src/app` folder.

---
If you see errors, make sure Node.js is installed. For help, ask a teammate or visit [Angular Docs](https://angular.io/docs).
