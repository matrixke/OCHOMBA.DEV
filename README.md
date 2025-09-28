# 🌐 OCHOMBA.DEV - Subscription Tracker Dashboard

A comprehensive subscription management and website control system built with React, TypeScript, and Supabase. This dashboard allows you to manage client subscriptions, track revenue, and remotely control client websites.

## 🚀 Live Demo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/matrixke/OCHOMBA.DEV.git)

## ✨ Features

### 📊 **Dashboard Management**
- **Customer Management**: Add, edit, and manage client information
- **Subscription Tracking**: Monitor active, expired, and blocked subscriptions
- **Revenue Analytics**: Comprehensive revenue tracking and reporting
- **Website Integration**: Manage client websites with remote control

### 🔒 **Website Control System**
- **Kill Switch**: Instantly block/unblock client websites
- **Automatic Blocking**: Auto-block websites when payments are overdue
- **Real-time Status**: Live website status monitoring
- **Support System**: Integrated support messaging

### 💰 **Payment Integration**
- **Paystack Integration**: Process payments securely
- **Custom Pricing**: Set individual pricing for each client
- **Revenue Tracking**: Track subscription and one-time payments
- **USD Conversion**: Multi-currency support

### 📈 **Analytics & Reporting**
- **Revenue Analytics**: Detailed revenue breakdowns and trends
- **Customer Analytics**: Client distribution and conversion rates
- **Monthly Reports**: Automated monthly revenue reports
- **Performance Metrics**: Track business growth and performance

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Payments**: Paystack
- **Deployment**: Vercel
- **Charts**: Recharts

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/matrixke/OCHOMBA.DEV.git
cd OCHOMBA.DEV
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database
Run the SQL migrations in your Supabase dashboard:
```sql
-- Run the migration files in supabase/migrations/
```

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

2. **Set Environment Variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   KILLSWITCH_API_KEY=your_killswitch_key
   PAYSTACK_SECRET_KEY=your_paystack_secret
   PAYSTACK_PUBLIC_KEY=your_paystack_public
   ```

3. **Deploy**: Click "Deploy" and your dashboard will be live!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Node.js:
- **Netlify**: Use the build command `npm run build`
- **Railway**: Connect your GitHub repo
- **DigitalOcean**: Use App Platform
- **AWS**: Use Amplify or Elastic Beanstalk

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations
3. Set up Row Level Security (RLS) policies
4. Configure authentication

### Paystack Setup
1. Create a Paystack account
2. Get your API keys
3. Configure webhook endpoints
4. Set up test and live environments

### Website Integration
Add this script to client websites:
```html
<script src="https://your-dashboard.vercel.app/site-integration.js"></script>
<script>
  OCHOMBASiteIntegration.init({
    domain: 'client-domain.com',
    apiKey: 'your-api-key',
    dashboardUrl: 'https://your-dashboard.vercel.app'
  });
</script>
```

## 📚 Documentation

- [Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md)
- [Website Integration Guide](./SITE_INTEGRATION_GUIDE.md)
- [Paystack Setup Guide](./PAYSTACK_SETUP_GUIDE.md)
- [Database Setup](./SIMPLE_DATABASE_SETUP.sql)

## 🎯 Use Cases

### For Agencies
- Manage multiple client subscriptions
- Track recurring revenue
- Control client websites remotely
- Monitor payment status

### For SaaS Companies
- Subscription management
- Revenue analytics
- Customer lifecycle tracking
- Automated billing

### For Freelancers
- Client project management
- Payment tracking
- Website control
- Revenue reporting

## 🔒 Security Features

- **API Key Authentication**: Secure API access
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Prevent injection attacks
- **Environment Variables**: Secure configuration
- **Row Level Security**: Database-level security

## 📊 API Endpoints

- `GET /api/killswitch` - Check website status
- `POST /api/support-message` - Send support messages
- `POST /api/paystack-webhook` - Handle payment webhooks
- `GET /api/cron-deactivation` - Daily deactivation cron

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the guides in the repository
- **Issues**: Open an issue on GitHub
- **Email**: Contact support through the dashboard

## 🌟 Features in Detail

### Customer Management
- Add/edit customer information
- Track subscription status
- Manage website URLs
- Set custom pricing
- Monitor payment history

### Website Control
- Real-time website blocking
- Automatic payment-based blocking
- Support message system
- Status monitoring
- Bulk operations

### Revenue Analytics
- Monthly revenue tracking
- Customer conversion rates
- Payment method analysis
- Growth metrics
- Export capabilities

### Payment Processing
- Paystack integration
- Webhook handling
- Subscription management
- Invoice generation
- Payment reminders

---

**Built with ❤️ by [OCHOMBA.DEV](https://github.com/matrixke)**