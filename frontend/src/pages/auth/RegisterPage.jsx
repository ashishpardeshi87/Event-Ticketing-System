import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors }
  } = useForm({
    mode: 'onChange',
    defaultValues: {}
  })

  const password = watch('password')
  const totalSteps = 3

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('registrationFormData')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        Object.keys(parsedData).forEach(key => {
          setValue(key, parsedData[key])
        })
        const savedStep = localStorage.getItem('registrationStep')
        if (savedStep) {
          setCurrentStep(parseInt(savedStep))
        }
      } catch (error) {
        console.error('Error loading saved form data:', error)
      }
    }
  }, [setValue])

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('registrationFormData', JSON.stringify(value))
      localStorage.setItem('registrationStep', currentStep.toString())
    })
    return () => subscription.unsubscribe()
  }, [watch, currentStep])

  const nextStep = async () => {
    let fieldsToValidate = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'email', 'mobile', 'gender']
    } else if (currentStep === 2) {
      fieldsToValidate = ['instituteName', 'userType', 'course', 'graduatingYear']
    }
    
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const displayName = `${data.firstName} ${data.lastName || ''}`.trim()
      localStorage.setItem('pendingUserData', JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        gender: data.gender,
        location: data.location,
        instituteName: data.instituteName,
        userType: data.userType,
        domain: data.domain,
        course: data.course,
        courseSpecialization: data.courseSpecialization,
        graduatingYear: data.graduatingYear,
        courseDuration: data.courseDuration,
        differentlyAbled: data.differentlyAbled || false
      }))

      await signUpWithEmail(data.email, data.password, displayName)
      
      localStorage.removeItem('registrationFormData')
      localStorage.removeItem('registrationStep')
      
      toast.success('Account created successfully!')
      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      localStorage.removeItem('registrationFormData')
      localStorage.removeItem('registrationStep')
      toast.success('Welcome!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error(error.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
          <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 mx-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First Name*
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter last name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email*
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email'
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Mobile*
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg text-sm">
                    +91
                  </span>
                  <input
                    {...register('mobile', {
                      required: 'Mobile is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Invalid mobile'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter mobile"
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender*
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
                    <label key={option} className="cursor-pointer">
                      <input
                        {...register('gender', { required: 'Select gender' })}
                        type="radio"
                        value={option.toLowerCase()}
                        className="sr-only"
                      />
                      <div className={`p-3 text-center border rounded-lg transition ${
                        watch('gender') === option.toLowerCase()
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-black'
                      }`}>
                        {option}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Location
                </label>
                <input
                  {...register('location')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="City, State"
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Institute Name*
                </label>
                <input
                  {...register('instituteName', { required: 'Institute name is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter institute name"
                />
                {errors.instituteName && (
                  <p className="mt-1 text-sm text-red-600">{errors.instituteName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  User Type*
                </label>
                <select
                  {...register('userType', { required: 'Select user type' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="college-student">College Student</option>
                  <option value="school-student">School Student</option>
                  <option value="professional">Professional</option>
                  <option value="fresher">Fresher</option>
                </select>
                {errors.userType && (
                  <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Domain
                </label>
                <select
                  {...register('domain')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select domain</option>
                  <option value="engineering">Engineering</option>
                  <option value="management">Management</option>
                  <option value="science">Science</option>
                  <option value="arts">Arts</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Course*
                </label>
                <select
                  {...register('course', { required: 'Select course' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select course</option>
                  <option value="btech">B.Tech/BE</option>
                  <option value="mtech">M.Tech/ME</option>
                  <option value="bca">BCA</option>
                  <option value="mca">MCA</option>
                  <option value="bsc">B.Sc</option>
                  <option value="msc">M.Sc</option>
                  <option value="others">Others</option>
                </select>
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600">{errors.course.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Specialization
                </label>
                <input
                  {...register('courseSpecialization')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Graduating Year*
                </label>
                <select
                  {...register('graduatingYear', { required: 'Select year' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select year</option>
                  {[2026, 2027, 2028, 2029, 2030].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.graduatingYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.graduatingYear.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Course Duration
                </label>
                <select
                  {...register('courseDuration')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select duration</option>
                  <option value="3 years">3 years</option>
                  <option value="4 years">4 years</option>
                  <option value="5 years">5 years</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Password & Terms */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Password*
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Min 6 characters' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Confirm Password*
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Confirm password',
                      validate: v => v === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <input
                  {...register('acceptTerms', { required: 'Accept terms' })}
                  type="checkbox"
                  className="mt-1 mr-3"
                />
                <label className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#terms" className="text-black font-medium hover:underline" onClick={(e) => e.preventDefault()}>
                    Terms & Conditions
                  </a>
                  {' '}and{' '}
                  <a href="#privacy" className="text-black font-medium hover:underline" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        {/* Google Sign In */}
        {currentStep === 1 && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default RegisterPage
