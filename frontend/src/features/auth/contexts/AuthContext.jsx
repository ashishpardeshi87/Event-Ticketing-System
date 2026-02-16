import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../../../config/firebase'
import { USER_ROLES } from '../../../config/constants'
import { authService } from '../../../api/services/authService'

const NOT_IN_PROVIDER = 'useAuthContext must be used within an AuthProvider'

const defaultContextValue = {
  user: null,
  loading: true,
  signInWithEmail: () => Promise.reject(new Error(NOT_IN_PROVIDER)),
  signUpWithEmail: () => Promise.reject(new Error(NOT_IN_PROVIDER)),
  signInWithGoogle: () => Promise.reject(new Error(NOT_IN_PROVIDER)),
  logout: () => Promise.reject(new Error(NOT_IN_PROVIDER)),
  isAdmin: () => false,
  isVolunteer: () => false,
  createUserDocument: () => Promise.reject(new Error(NOT_IN_PROVIDER))
}

const AuthContext = createContext(defaultContextValue)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error(NOT_IN_PROVIDER)
  }
  if (typeof context.signUpWithEmail !== 'function') {
    throw new Error(NOT_IN_PROVIDER + ' (invalid context shape)')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Define createUserDocument BEFORE useEffect that uses it
  const createUserDocument = useCallback(async (user, additionalData = {}) => {
    if (!user) return
    
    const userRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      const { displayName, email, photoURL } = user
      const createdAt = new Date()
      
      const userData = {
        displayName,
        email,
        photoURL,
        role: USER_ROLES.USER,
        createdAt,
        updatedAt: createdAt,
        ...additionalData
      }
      
      try {
        await setDoc(userRef, userData)
        return userData
      } catch (error) {
        console.error('Error creating user document:', error)
        throw error
      }
    } else {
      // Update existing user with additional data if provided
      if (Object.keys(additionalData).length > 0) {
        const updateData = {
          ...additionalData,
          updatedAt: new Date()
        }
        
        try {
          await setDoc(userRef, updateData, { merge: true })
          const updatedDoc = await getDoc(userRef)
          return updatedDoc.data()
        } catch (error) {
          console.error('Error updating user document:', error)
        }
      }
      
      return userDoc.data()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = null
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          userData = userDoc.exists() ? userDoc.data() : null
        } catch (firestoreErr) {
          // Firestore can fail when "client is offline" or network/rules issue.
          // Fall through to backend sync below (skip createUserDocument to avoid another offline error).
          if (firestoreErr?.code !== 'unavailable' && firestoreErr?.message !== 'Failed to get document because the client is offline.') {
            console.error('Error fetching user data from Firestore:', firestoreErr)
          }
        }

        if (userData && userData.firstName) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            ...userData
          })
          setLoading(false)
          return
        }

        if (!userData) {
          // No doc in Firestore (or Firestore failed e.g. "client is offline"). Use backend to create/return profile.
          try {
            const res = await authService.getProfile()
            const profile = res?.data
            if (profile) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                ...profile
              })
              setLoading(false)
              return
            }
          } catch (apiErr) {
            console.warn('Backend profile sync failed:', apiErr?.response?.status, apiErr?.message)
          }
          // Firestore failed and backend failed: set minimal user so app still works; avoid calling createUserDocument (would hit offline again).
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: USER_ROLES.USER
          })
          setLoading(false)
          return
        }

        // We have userData from Firestore but missing firstName (e.g. new signup). Merge pendingData via createUserDocument.
        try {
          const pendingData = localStorage.getItem('pendingUserData')
          const additionalData = pendingData ? JSON.parse(pendingData) : {}
          const merged = await createUserDocument(firebaseUser, additionalData)
          if (merged) userData = merged
          localStorage.removeItem('pendingUserData')
        } catch (createErr) {
          console.warn('Create/update user document failed:', createErr?.message)
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          ...userData
        })
        setLoading(false)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [createUserDocument])

  const signInWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await createUserDocument(result.user)
      return result
    } catch (error) {
      throw error
    }
  }, [createUserDocument])

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name
      await updateProfile(result.user, { displayName })
      
      // Create user document in Firestore
      await createUserDocument(result.user, { displayName })
      
      return result
    } catch (error) {
      throw error
    }
  }, [createUserDocument])

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await createUserDocument(result.user)
      return result
    } catch (error) {
      throw error
    }
  }, [createUserDocument])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }, [])

  const isAdmin = useCallback(() => {
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN
  }, [user?.role])

  const isVolunteer = useCallback(() => {
    return user?.role === USER_ROLES.VOLUNTEER || user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN
  }, [user?.role])

  const value = useMemo(() => ({
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    isAdmin,
    isVolunteer,
    createUserDocument
  }), [user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout, isAdmin, isVolunteer, createUserDocument])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}