"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  Search,
  Shield,
  Zap,
  BookOpen,
  FlaskConical,
  Headphones,
  Shirt,
  Dumbbell,
  BedDouble,
  Wrench,
  Palette,
  User,
  RefreshCw,
  MapPin,
  Backpack,
} from "lucide-react";

// Phone mockup category data - moved outside component to prevent recreation on each render
const PHONE_CATEGORIES = [
  { icon: BookOpen, label: "Books & Notes", bgColor: "bg-blue-50", iconColor: "text-blue-600" },
  { icon: FlaskConical, label: "Lab Essentials", bgColor: "bg-gray-50", iconColor: "text-gray-600" },
  { icon: Headphones, label: "Electronics", bgColor: "bg-slate-50", iconColor: "text-slate-600" },
  { icon: Shirt, label: "Clothing", bgColor: "bg-orange-50", iconColor: "text-orange-600" },
  { icon: Dumbbell, label: "Sports", bgColor: "bg-amber-50", iconColor: "text-amber-600" },
  { icon: BedDouble, label: "Hostel Items", bgColor: "bg-yellow-50", iconColor: "text-yellow-600" },
  { icon: Wrench, label: "Tools", bgColor: "bg-emerald-50", iconColor: "text-emerald-600" },
  { icon: Palette, label: "Art & Creativity", bgColor: "bg-rose-50", iconColor: "text-rose-600" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">QuickGrab</span>
          </div>
         
          <div className="flex items-center space-x-4">
            <Link href="/signin">
              <Button variant="outline" className="rounded-2xl">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-orange-600 rounded-2xl">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side - Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 mb-6 shadow-sm">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-800 tracking-wide">VERIFIED STUDENTS ONLY</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The Campus <span className="text-orange-600">Marketplace</span>
              <br />for <span className="text-orange-600">Buying, Renting</span> &
              <br /><span className="text-orange-600">Finding Anything</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Buy used items, rent what you need for a day, or recover lost belongings — all from verified students on your own campus. Instant, safe, and built for student life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 bg-orange-600 text-white hover:bg-orange-700 rounded-full shadow-lg">
                  Start Trading
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/home">
                <Button size="lg" variant="outline" className="text-lg px-8 rounded-full border-2 border-gray-900 text-gray-900 hover:bg-gray-100">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side - Phone Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Why QuickGrab Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24 bg-orange-50/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6">Why QuickGrab?</h2>
          <p className="text-center text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed">
            QuickGrab solves the daily problems students face on campus— buying essentials, renting items for short use, recovering lost belongings, and getting fast help from fellow students. Everything happens inside your campus, safely and instantly.
          </p>
          
          <div className="grid md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-10 md:gap-y-12">
            <WhyFeatureItem
              icon={<Shield className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="Verified Students Only"
              description="Every user is verified with their student ID for safe, trusted interactions."
            />
            <WhyFeatureItem
              icon={<RefreshCw className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="Buy & Sell in Seconds"
              description="List books, lab coats, gadgets, hostel items, and more – instantly and easily."
            />
            <WhyFeatureItem
              icon={<Search className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="Rent What You Need"
              description="Need a calculator, charger, or lab coat for one class? Rent instead of buying."
            />
            <WhyFeatureItem
              icon={<Zap className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="RelayRunner Delivery"
              description="Busy in class? A fellow student can deliver the item to you in minutes."
            />
            <WhyFeatureItem
              icon={<MapPin className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="Preset Pickup Spots"
              description="Meet at safe, campus-known locations like the library, canteen, or hostel gate."
            />
            <WhyFeatureItem
              icon={<Backpack className="h-7 w-7 text-orange-600" strokeWidth={1.5} />}
              title="Lost & Found System"
              description="A dedicated board to report and recover lost items faster."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step number={1} title="Sign Up & Verify" description="Register with your college email and verify your student ID." />
            <Step number={2} title="Search or List" description="Find items with AI search or list your own for sale." />
            <Step number={3} title="Chat & Meet" description="Connect with verified students and meet safely on campus." />
            <Step number={4} title="Complete & Rate" description="Finalize your transaction and build your trust score." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to QuickGrab?</h2>
        <p className="text-gray-600 mb-8">Join thousands of verified students trading safely on campus.</p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-12 bg-orange-600 rounded-2xl">
            Create Your Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">QuickGrab</span>
          </div>
          <p>&copy; {new Date().getFullYear()} QuickGrab. AI-Powered Campus Marketplace.</p>
        </div>
      </footer>
    </div>
  );
}

function WhyFeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative w-72 md:w-80 bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden">
          {/* App Content */}
          <div className="p-5 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span className="font-bold text-gray-900">QuickGrab</span>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>

            {/* Categories Section */}
            <h3 className="font-bold text-gray-900 mb-4">Explore Categories</h3>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {PHONE_CATEGORIES.map((category, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center mb-1`}>
                    <category.icon className={`h-5 w-5 ${category.iconColor}`} />
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{category.label}</span>
                </div>
              ))}
            </div>

            {/* RelayRunner Request */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">RelayRunner Request</span>
            </div>

            {/* Product Card */}
            <div className="border border-gray-200 rounded-xl p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Headphones className="h-10 w-10 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-orange-600 font-medium">For Sale</span>
                <h4 className="font-semibold text-gray-900 text-sm">Wireless Headphones</h4>
                <p className="text-xs text-gray-500">205 Emerson Hall</p>
                <p className="font-bold text-gray-900 text-sm">$50</p>
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center pb-2 pt-4">
            <div className="w-32 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
