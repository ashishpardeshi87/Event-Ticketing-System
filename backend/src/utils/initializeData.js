import { db } from '../config/firebase.js'

// Initialize sample data for the platform
export const initializeSampleData = async () => {
  try {
    console.log('🔄 Initializing sample data...')

    // Check if data already exists
    const eventsSnapshot = await db.collection('events').limit(1).get()
    if (!eventsSnapshot.empty) {
      console.log('✅ Sample data already exists, skipping initialization')
      return
    }

    // Sample pass types
    const passTypes = [
      {
        id: 'single_day',
        name: 'Single Day Pass',
        description: 'Access to all events for one day',
        price: 299,
        originalPrice: 399,
        maxEvents: 3,
        allowedEvents: [],
        features: [
          'Access to all technical events',
          'Workshop participation',
          'Networking sessions',
          'Lunch included'
        ],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'multi_day',
        name: 'Multi Day Pass',
        description: 'Complete festival access for all 3 days',
        price: 799,
        originalPrice: 999,
        maxEvents: 10,
        allowedEvents: [],
        features: [
          'All Single Day Pass benefits',
          'Access to all cultural events',
          'VIP seating in main auditorium',
          'All meals included',
          'Exclusive merchandise',
          'Certificate of participation'
        ],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'vip',
        name: 'VIP Pass',
        description: 'Premium experience with exclusive benefits',
        price: 1499,
        originalPrice: 1999,
        maxEvents: 999,
        allowedEvents: [],
        features: [
          'All Multi Day Pass benefits',
          'Meet & greet with speakers',
          'Priority registration for events',
          'Exclusive VIP lounge access',
          'Premium merchandise kit',
          'Dedicated support team'
        ],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Sample events
    const events = [
      {
        name: 'Code Sprint Championship',
        bannerImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        description: 'Competitive programming contest with exciting prizes. Test your algorithmic skills against the best programmers.',
        category: 'technical',
        date: new Date('2026-03-15'),
        time: '10:00 AM',
        venue: 'Main Auditorium',
        maxParticipants: 100,
        maxTeamSize: 1,
        maxTeams: 0,
        teamCount: 0,
        registrationFee: 200,
        status: 'open',
        isActive: true,
        registeredCount: 0,
        requirements: ['Laptop with programming environment', 'Valid ID'],
        rules: ['Maximum 1 entry per participant', 'No external help or internet allowed during competition', 'Participants must be present at venue 15 mins before start'],
        prizes: ['₹50,000 First Prize', '₹30,000 Second Prize', '₹20,000 Third Prize'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'AI/ML Workshop',
        bannerImageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
        description: 'Hands-on workshop on Machine Learning fundamentals. Learn from industry experts.',
        category: 'workshop',
        date: new Date('2026-03-16'),
        time: '2:00 PM',
        venue: 'Tech Lab 1',
        maxParticipants: 50,
        maxTeamSize: 1,
        maxTeams: 0,
        teamCount: 0,
        registrationFee: 150,
        status: 'open',
        isActive: true,
        registeredCount: 0,
        requirements: ['Basic Python knowledge', 'Laptop'],
        rules: ['Bring your own laptop', 'Pre-registration required', 'No refunds after registration'],
        prizes: ['Certificate of completion', 'Workshop materials'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cultural Night',
        bannerImageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        description: 'Evening of music, dance, and entertainment. Showcase your talents!',
        category: 'cultural',
        date: new Date('2026-03-17'),
        time: '7:00 PM',
        venue: 'Open Ground',
        maxParticipants: 500,
        maxTeamSize: 1,
        maxTeams: 0,
        teamCount: 0,
        registrationFee: 0,
        status: 'open',
        isActive: true,
        registeredCount: 0,
        requirements: ['Performance registration (if participating)'],
        rules: ['Maximum 5 minutes per performance', 'PG content not allowed', 'Submit track list 2 days before event'],
        prizes: ['Best Performance Awards', 'Participation certificates'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Web Development Hackathon',
        bannerImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
        description: '24-hour coding marathon to build innovative web solutions. Form teams and create amazing projects!',
        category: 'technical',
        date: new Date('2026-03-18'),
        time: '9:00 AM',
        venue: 'Innovation Hub',
        maxParticipants: 80,
        maxTeamSize: 4,
        maxTeams: 20,
        teamCount: 0,
        registrationFee: 300,
        status: 'open',
        isActive: true,
        registeredCount: 0,
        requirements: ['Team of 2-4 members', 'Laptops', 'Development tools'],
        rules: ['Team size 2-4 members', '24-hour duration - no leaving venue', 'Original code only - no plagiarism', 'Internet allowed for documentation only'],
        prizes: ['₹1,00,000 Winner', '₹60,000 Runner-up', 'Internship opportunities'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tech Talk: Future of Technology',
        bannerImageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
        description: 'Inspiring talk by industry leaders about emerging technologies and career opportunities.',
        category: 'workshop',
        date: new Date('2026-03-19'),
        time: '11:00 AM',
        venue: 'Main Auditorium',
        maxParticipants: 300,
        maxTeamSize: 1,
        maxTeams: 0,
        teamCount: 0,
        registrationFee: 0,
        status: 'open',
        isActive: true,
        registeredCount: 0,
        requirements: ['Student ID'],
        rules: ['First-come-first-served seating', 'No recording without permission', 'Q&A at the end only'],
        prizes: ['Networking opportunities', 'Q&A session'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Add pass types
    console.log('📝 Adding pass types...')
    for (const passType of passTypes) {
      await db.collection('pass_types').doc(passType.id).set(passType)
    }

    // Add events
    console.log('📅 Adding events...')
    for (const event of events) {
      await db.collection('events').add(event)
    }

    console.log('✅ Sample data initialized successfully!')
    console.log(`📊 Added ${passTypes.length} pass types and ${events.length} events`)

  } catch (error) {
    console.error('❌ Error initializing sample data:', error)
    throw error
  }
}

// Initialize admin user (call this after first user registers)
export const makeUserAdmin = async (userEmail) => {
  try {
    console.log(`🔐 Making ${userEmail} an admin...`)
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', userEmail)
      .get()
    
    if (usersSnapshot.empty) {
      throw new Error('User not found')
    }
    
    const userDoc = usersSnapshot.docs[0]
    
    // Update user role
    await userDoc.ref.update({
      role: 'admin',
      updatedAt: new Date()
    })
    
    console.log(`✅ ${userEmail} is now an admin!`)
    
  } catch (error) {
    console.error('❌ Error making user admin:', error)
    throw error
  }
}