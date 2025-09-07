import Link from 'next/link'
import { Users, Eye, Rocket, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Lead Tracker CRM
          </h1>
          <p className="text-xl text-gray-600">
            Manage Meta advertising leads with Google Sheets sync
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Demo Mode Card */}
          <Link href="/demo" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center mb-4">
                <Eye className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Demo Mode</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Explore all features with sample data. No setup required!
              </p>
              <ul className="text-sm text-gray-500 space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Instant access
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  50 sample leads
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  All features enabled
                </li>
              </ul>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                Try Demo →
              </div>
            </div>
          </Link>

          {/* Real Login Card */}
          <Link href="/auth/login" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Production</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Login with Supabase account to access real data
              </p>
              <ul className="text-sm text-gray-500 space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Real-time sync
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Team collaboration
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Secure database
                </li>
              </ul>
              <div className="text-green-600 font-medium group-hover:text-green-700">
                Login →
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Rocket className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Google Sheets Sync</h4>
                <p className="text-sm text-gray-600">Automatic 5-minute sync from public sheets</p>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Lead Pipeline</h4>
                <p className="text-sm text-gray-600">Track leads from New to Won/Lost</p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Team Management</h4>
                <p className="text-sm text-gray-600">Assign leads and track performance</p>
              </div>
            </div>
            <div className="flex items-start">
              <Eye className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Analytics Dashboard</h4>
                <p className="text-sm text-gray-600">Conversion rates and campaign metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Setup takes only 15 minutes • Free tier available • Check SETUP.md for instructions</p>
        </div>
      </div>
    </div>
  )
}
