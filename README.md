# ProductVista - Authentication and Product Management

ProductVista is a fully functional authentication and product management system built with React, TypeScript, TailwindCSS, and Firebase. It allows users to sign up, log in, browse products, place orders, and view their order history.

## Key Features

- **User Authentication:** Secure Firebase authentication system for user signup and login
- **Product Browsing:** Dynamic product catalog from the Fake Store API
- **Product Filtering:** Filter products by category and search term
- **Shopping Cart:** Add items to cart, update quantities, and place orders
- **Order Management:** View your order history and details
- **Order Reports:** Download order reports in CSV and HTML formats

## Technology Stack

- **Frontend:** React, TypeScript, TailwindCSS, Shadcn UI
- **Authentication:** Firebase Authentication
- **Database:** Firestore
- **State Management:** React Context API
- **API:** External product data from Fake Store API
- **Routing:** React Router v6
- **Forms:** React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd auth-product-vista
   ```

2. Install dependencies:

   ```
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:

   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Enable Firestore Database
   - Create a web app and copy the Firebase config
   - The Firebase config is already set up in `src/lib/firebase.ts`

4. Run the development server:

   ```
   npm run dev
   # or
   yarn dev
   ```

5. Access the application at [http://localhost:5173](http://localhost:5173)

## Usage

### Authentication

- **Sign Up:** Create a new account with your name, email, and password
- **Log In:** Use your email and password to log in
- **Demo Account:** Use demo@example.com with password "password" for a demo account

### Product Management

- **Browse Products:** View all products from the Fake Store API
- **Filter Products:** Use the category selector and search bar to filter products
- **Add to Cart:** Add products to your shopping cart
- **View Cart:** See all items in your cart and update quantities
- **Place Order:** Complete the checkout process to place an order

### Order Management

- **View Orders:** See a list of all your orders
- **Order Details:** View complete details of each order
- **Download Reports:** Download order reports in CSV or HTML format

## Project Structure

- `/src/components` - Reusable UI components
- `/src/contexts` - Context providers for auth and product state
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility functions and Firebase setup
- `/src/pages` - Page components for each route
  - `/auth` - Authentication pages (login, signup)
  - `/dashboard` - Dashboard pages (products, cart, orders, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
