# ProctorHub Frontend

A modern, responsive React frontend for the Online Proctoring System with beautiful UI/UX design.

## 🚀 Features

### Modern Design System
- **Glassmorphism Effects**: Subtle backdrop blur and transparency effects
- **Gradient Backgrounds**: Beautiful gradient overlays and button styles
- **Smooth Animations**: Fade-in, slide-up, and scale animations
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Custom Color Palette**: Carefully crafted color system with semantic naming

### Components
- **Login Page**: Role-based authentication with modern card design
- **Admin Dashboard**: Session management with real-time updates
- **Student Dashboard**: Proctoring interface with camera feed
- **Status Indicators**: Color-coded status badges with icons
- **Loading Spinners**: Elegant loading states
- **Notifications**: Toast notifications for user feedback

### UI/UX Enhancements
- **Typography**: Inter font family for better readability
- **Icons**: Heroicons for consistent iconography
- **Shadows**: Soft, layered shadows for depth
- **Borders**: Rounded corners and subtle borders
- **Hover Effects**: Interactive hover states
- **Focus States**: Accessible focus indicators

## 🛠️ Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Webcam** - Camera integration
- **Vite** - Fast build tool and dev server

## 🎨 Design System

### Colors
- **Primary**: Blue tones for main actions
- **Secondary**: Gray tones for neutral elements
- **Success**: Green tones for positive states
- **Warning**: Yellow/Orange tones for caution
- **Danger**: Red tones for errors and alerts

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700, 800
- **Font Sizes**: Responsive scale from 12px to 48px

### Spacing
- **Base Unit**: 4px (0.25rem)
- **Scale**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64

### Shadows
- **Soft**: Subtle elevation for cards
- **Medium**: Medium elevation for interactive elements
- **Large**: Strong elevation for modals
- **Glow**: Colored glow effects for focus states

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🎯 Key Features

### Admin Dashboard
- **Session Creation**: Create new proctoring sessions
- **Real-time Monitoring**: Live updates via WebSocket
- **Session Management**: View and manage active sessions
- **Status Tracking**: Monitor student proctoring status
- **Link Generation**: Generate student access links

### Student Dashboard
- **Camera Integration**: Real-time camera feed
- **Proctoring Status**: Live status updates
- **Session Timer**: Track session duration
- **Test Interface**: Embedded Google Forms
- **Privacy Notices**: Clear privacy information

### Login System
- **Role Selection**: Choose between Admin and Student
- **Modern UI**: Beautiful login interface
- **Error Handling**: User-friendly error messages
- **Loading States**: Smooth loading animations

## 🔧 Customization

### Adding New Components
1. Create component in `src/components/`
2. Use Tailwind classes for styling
3. Follow the design system patterns
4. Add TypeScript interfaces

### Modifying Colors
Update `tailwind.config.js` to modify the color palette:
```javascript
colors: {
  primary: {
    // Your custom primary colors
  }
}
```

### Adding Animations
Use the predefined animation classes:
- `animate-fade-in`
- `animate-slide-up`
- `animate-slide-down`
- `animate-scale-in`

## 📦 Component Library

### LoadingSpinner
```tsx
<LoadingSpinner size="md" text="Loading..." />
```

### StatusIndicator
```tsx
<StatusIndicator status="Focused" size="md" showText={true} />
```

### Notification
```tsx
<Notification 
  type="success" 
  title="Success!" 
  message="Session created successfully" 
/>
```

## 🎨 Design Patterns

### Cards
Use the `.card` class for consistent card styling:
```tsx
<div className="card">
  {/* Card content */}
</div>
```

### Buttons
Use semantic button classes:
```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-danger">Danger Action</button>
```

### Input Fields
Use the `.input-field` class for form inputs:
```tsx
<input className="input-field" placeholder="Enter text..." />
```

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Optimized asset loading
- **Lazy Loading**: Component lazy loading
- **Bundle Analysis**: Built-in bundle analyzer

## 🔒 Security Features

- **Input Validation**: Client-side form validation
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Axios CSRF token handling
- **Secure Headers**: Proper security headers

## 📱 Mobile Optimization

- **Touch Targets**: Minimum 44px touch targets
- **Responsive Images**: Optimized for different screen sizes
- **Mobile Navigation**: Touch-friendly navigation
- **Performance**: Optimized for mobile devices

## 🎯 Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and roles
- **Color Contrast**: WCAG AA compliant
- **Focus Management**: Proper focus indicators

## 🐛 Troubleshooting

### Common Issues
1. **Camera not working**: Check browser permissions
2. **WebSocket connection failed**: Verify backend is running
3. **Styling issues**: Clear browser cache
4. **Build errors**: Delete node_modules and reinstall

### Debug Mode
Enable debug mode by setting `VITE_DEBUG=true` in your environment.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue in the repository or contact the development team.