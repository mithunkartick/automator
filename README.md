
# Flowly

Ever felt like you were wasting more time than required on merely simple tasks? Flowly's got you covered.
Flowly simplifies workflows, making it easy to integrate automation into your daily lifestyle.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/ZJRh2d00W8A/0.jpg)](https://www.youtube.com/watch?v=ZJRh2d00W8A) 

# Setup



## Dependencies

Install my-project with npm

```bash
  npm install
```

## Setup Clerk, Prisma and NeonTech

Create an account and add an SSO for Google in Clerk Authentication

Setup Prisma and NeonTech

Add the publishable keys to the .env file.

## Add Google Scopes for OAuth and Drive API

Go to console.cloud.google.com and enable Google Drive API and add scopes for basic info and Google Drive API.

## IMPORTANT: Use TailwindCSS v3

Due to my familiarity with v3 over v4, I have used TailwindCSS v3 in this project. 

## Setup ngrok

Add ngrok hostname in the provisioned placeholder in .env file after creating an account with ngrok

Run the following command
    
    ngrok http https://localhost:3000

## Experimental HTTPS

Make sure to use HTTPS over HTTP when accessing or referring to the localhost domain, since the package.json contains the '--experimental-https' tag.

## Voila!

    npm run dev

The project will be now live at https://localhost:3000. 

If there are any more questions, contact us at teamprocrastinot@gmail.com.

# Team Procrastinot

Mithun Kartick B (mithun_kb@ph.iitr.ac.in)

Vrishin M (vrishin_m@ch.iitr.ac.in)

Huthaifa K (huthaifa@hre.iitr.ac.in)

Krrish Dhamodharan (krrish_d@ee.iitr.ac.in)



    
