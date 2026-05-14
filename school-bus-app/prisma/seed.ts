import { PrismaClient, UserRole, OrganisationType, UserStatus, DriverStatus, VehicleStatus, ScheduleType, ScheduleStatus, TripStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting TrackBuddy Multi-Tenant Seed...')

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@trackbuddy.com' },
    update: {},
    create: {
      email: 'super@trackbuddy.com',
      password: passwordHash,
      name: 'TrackBuddy Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Super Admin created')

  // 2. Create Sample Organisation (School)
  const schoolOrg = await prisma.organisation.create({
    data: {
      name: 'Greenwood International School',
      type: OrganisationType.SCHOOL,
      settings: {
        timezone: 'Asia/Kuala_Lumpur',
        currency: 'MYR',
        trackingEnabled: true,
      },
      brandingConfig: {
        primaryColor: '#2E7D32',
        logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa19020a?w=200',
      },
    },
  })
  console.log('✅ Organisation created: Greenwood')

  // 3. Create Branches
  const primaryBranch = await prisma.branch.create({
    data: {
      organisationId: schoolOrg.id,
      name: 'Primary Campus',
      address: '123 Education Way, Kuala Lumpur',
      contactInfo: { phone: '+60 3-1234-5678', email: 'primary@greenwood.edu.my' },
    },
  })
  console.log('✅ Branch created: Primary Campus')

  // 4. Create Org Admin
  const orgAdmin = await prisma.user.create({
    data: {
      email: 'admin@greenwood.edu.my',
      password: passwordHash,
      name: 'Mervin Org Admin',
      role: UserRole.ORG_ADMIN,
      status: UserStatus.ACTIVE,
      organisationId: schoolOrg.id,
    },
  })
  console.log('✅ Org Admin created')

  // 5. Create Driver & Profile
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@greenwood.edu.my',
      password: passwordHash,
      name: 'John Driver',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      organisationId: schoolOrg.id,
    },
  })

  const driverProfile = await prisma.driverProfile.create({
    data: {
      userId: driverUser.id,
      organisationId: schoolOrg.id,
      licenseNumber: 'L-99887766',
      licenseExpiry: new Date('2028-12-31'),
      status: DriverStatus.ACTIVE,
      address: '45 Driver Lane, KL',
      emergencyContact: { name: 'Wife', phone: '+60 12-345-6789' },
    },
  })
  console.log('✅ Driver created')

  // 6. Create Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      organisationId: schoolOrg.id,
      plateNumber: 'BBA 1234',
      make: 'Toyota',
      model: 'Coaster',
      year: 2022,
      capacity: 30,
      status: VehicleStatus.ACTIVE,
      wialonUnitId: '2564893', // Mock Wialon ID
    },
  })
  console.log('✅ Vehicle created')

  // 7. Create Route & Stops
  const route = await prisma.route.create({
    data: {
      organisationId: schoolOrg.id,
      branchId: primaryBranch.id,
      name: 'Morning Route A1',
      description: 'Route serving Ampang area',
      active: true,
    },
  })

  const stop1 = await prisma.stop.create({
    data: {
      routeId: route.id,
      name: 'Ampang Point',
      address: 'Jalan Ampang, 68000 Ampang',
      latitude: 3.1581,
      longitude: 101.7516,
      sequenceOrder: 1,
    },
  })

  const stop2 = await prisma.stop.create({
    data: {
      routeId: route.id,
      name: 'Main Gate',
      address: 'School Entrance',
      latitude: 3.1600,
      longitude: 101.7600,
      sequenceOrder: 2,
    },
  })
  console.log('✅ Route & Stops created')

  // 8. Create Schedule
  const schedule = await prisma.schedule.create({
    data: {
      organisationId: schoolOrg.id,
      routeId: route.id,
      vehicleId: vehicle.id,
      driverId: driverUser.id,
      type: ScheduleType.RECURRING,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      startTime: '07:00:00',
      endTime: '08:30:00',
      status: ScheduleStatus.APPROVED,
    },
  })
  console.log('✅ Schedule created')

  // 9. Create Passenger & Guardian
  const passenger = await prisma.passenger.create({
    data: {
      organisationId: schoolOrg.id,
      branchId: primaryBranch.id,
      name: 'Timmy Student',
      nationality: 'Malaysian',
      dob: new Date('2015-05-15'),
      pickupAddress: '42 Residential Dr, Ampang',
      dropoffAddress: 'School Main Gate',
      active: true,
    },
  })

  const guardianUser = await prisma.user.create({
    data: {
      email: 'parent@home.com',
      password: passwordHash,
      name: 'Alice Guardian',
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      organisationId: schoolOrg.id,
    },
  })

  const guardian = await prisma.guardian.create({
    data: {
      passengerId: passenger.id,
      userId: guardianUser.id,
      name: 'Alice Guardian',
      relationship: 'Mother',
      phonePrimary: '+60 17-000-1111',
      isEmergencyContact: true,
    },
  })

  // Link passenger to schedule
  await prisma.schedulePassenger.create({
    data: {
      scheduleId: schedule.id,
      passengerId: passenger.id,
      pickupStopId: stop1.id,
      dropoffStopId: stop2.id,
    },
  })
  console.log('✅ Passenger & Guardian created')

  console.log('\n✨ Seeding Complete!')
  console.log('--------------------------------------------------')
  console.log('Super Admin: super@trackbuddy.com / password123')
  console.log('Org Admin  : admin@greenwood.edu.my / password123')
  console.log('Driver     : driver@greenwood.edu.my / password123')
  console.log('Parent     : parent@home.com / password123')
  console.log('--------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
