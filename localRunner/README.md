# 📦 `createUser` Lambda Module

This module defines a Lambda function to create a new user in DynamoDB using Node.js and AWS SDK v3.

---

## 📋 Prerequisites

- AWS account with permissions to:
  - Create and update Lambda functions
  - Read/write to DynamoDB
- A **DynamoDB table** with:
  - Partition key: `PK`
  - Sort key: `SK`
  - GSI1
    - Stars (PK)
    - SK

---

## 📁 Files Overview

- `createUserHandler.mjs` – Main Lambda handler
- `createUserData.mjs` – Writes a new user to DynamoDB
- `createUserEntitly.mjs` – User object definition and key generation
- `handler_response.mjs` – Standardized API responses
- `esbuild.config.js` – Build script using esbuild

---

## 🛠️ Deployment Steps

### ✅ 1. Install dependencies (once)

```bash
npm install
```

### ✅ 2. Update env variables in createUserData.mjs

- AWS_REGION
- USER_TABLE
- AWS_PROFILE

### ✅ 3. Build the Lambda

```bash
node esbuild.config.js
```

> This will output a bundled file to `dist/index.mjs`.

### ✅ 4. Zip the bundle

```bash
zip bundle.zip dist/index.mjs
```

### ✅ 5. Upload to AWS Console

1. Go to the **Lambda console**
2. Select your function
3. Click the **Code** tab
4. Choose **Upload from .zip file**
5. Select `bundle.zip`
6. Click **Deploy**

---

## ✅ Example Payload to Test

Use this when testing in the AWS Console:

```json
{
  "httpMethod": "POST",
  "body": "{\"username\":\"STUDENT01\",\"email\":\"student01@example.com\",\"name\":\"Student One\"}"
}
```

---

## ❗ Notes

- The Lambda expects environment variables:
  - `AWS_REGION`
  - `USER_TABLE` (name of your DynamoDB table)

Set these in the **Lambda configuration** under **Environment Variables**.

- If a user with the same `username` already exists, the Lambda will return a `409 Conflict` response.