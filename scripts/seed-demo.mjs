/**
 * Demo seed — populates RentFlow with realistic Philippine rental shop data.
 * Run: node scripts/seed-demo.mjs
 */

const SUPABASE_URL = 'https://uxgvtbuzufnilhrlxcwu.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4Z3Z0YnV6dWZuaWxocmx4Y3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA0NDA3MSwiZXhwIjoyMDk0NjIwMDcxfQ.cXfB0ZoXriZDpWnxeK5W4ZOw6AKTgv0KgLI6R4nfrGQ';

const ORG_ID    = '5da0b76b-5144-4d6b-985b-55a478f801ac';
const BRANCH_ID = '95b9aff2-f3f4-4ca7-9cf4-9147e5bafffd';

const H = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function insert(table, rows) {
  const body = Array.isArray(rows) ? rows : [rows];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: H, body: JSON.stringify(body),
  });
  const data = await r.json();
  if (r.status >= 400) throw new Error(`INSERT ${table} [${r.status}]: ${JSON.stringify(data)}`);
  return data;
}

async function patch(table, filter, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  return r.status;
}

async function del(table, filter) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE', headers: { ...H, 'Prefer': 'return=minimal' },
  });
  return r.status;
}

function uid() { return crypto.randomUUID(); }

// Dates relative to 2026-05-18 (today)
function dt(offsetDays, hour = 8) {
  const d = new Date('2026-05-18T00:00:00+08:00');
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour);
  return d.toISOString();
}

// ─── IMAGES ───────────────────────────────────────────────────────────────────
const IMG = {
  gen5:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop',
  gen10:   'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?w=600&auto=format&fit=crop',
  mixer:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop',
  scaff:   'https://images.unsplash.com/photo-1504308938169-ca44c51fc85a?w=600&auto=format&fit=crop',
  washer:  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
  drill:   'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop',
  grinder: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop',
  welder:  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop',
  chain:   'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop',
  pump:    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop',
};

async function main() {
  console.log('🌱 Starting demo seed…\n');

  // ── Clear existing data ────────────────────────────────────────────────────
  console.log('🗑  Clearing existing data…');
  await del('payments',      `organization_id=eq.${ORG_ID}`);
  await del('booking_items', `booking_id=in.(select+id+from+bookings+where+organization_id+eq+${ORG_ID})`);
  await del('bookings',      `organization_id=eq.${ORG_ID}`);
  await del('pricing_tiers', `organization_id=eq.${ORG_ID}`);
  await del('equipment',     `organization_id=eq.${ORG_ID}`);
  await del('customers',     `organization_id=eq.${ORG_ID}`);

  // ── Equipment ─────────────────────────────────────────────────────────────
  console.log('⚙️  Inserting equipment…');
  const eqRows = [
    { id: uid(), name: 'Yamaha 5kVA Generator',    category: 'Power',        stock_total: 3,  stock_available: 2, status: 'available', description: 'Reliable 5kVA gasoline generator. Ideal for small job sites, events, and household backup power.',                            image_urls: [IMG.gen5]    },
    { id: uid(), name: 'Honda 10kVA Generator',    category: 'Power',        stock_total: 2,  stock_available: 1, status: 'available', description: 'Heavy-duty 10kVA diesel generator. Powers entire construction sites and large commercial events.',                             image_urls: [IMG.gen10]   },
    { id: uid(), name: 'Concrete Mixer 350L',      category: 'Construction', stock_total: 3,  stock_available: 3, status: 'available', description: '350-liter drum concrete mixer with electric motor. Suitable for columns, slabs, and footings.',                              image_urls: [IMG.mixer]   },
    { id: uid(), name: 'Scaffolding Set (1 Floor)',category: 'Construction', stock_total: 10, stock_available: 8, status: 'available', description: 'Complete scaffolding set for one floor level (~3m). Includes frames, cross braces, and base jacks.',                         image_urls: [IMG.scaff]   },
    { id: uid(), name: 'Pressure Washer 200 Bar',  category: 'Cleaning',     stock_total: 2,  stock_available: 2, status: 'available', description: '200-bar cold water pressure washer. Great for surface prep, vehicle washing, and building façade cleaning.',                 image_urls: [IMG.washer]  },
    { id: uid(), name: 'Rotary Hammer Drill',      category: 'Power Tools',  stock_total: 4,  stock_available: 2, status: 'rented',    description: 'SDS-plus rotary hammer drill. Drills through concrete, masonry, and steel. Includes full bit set.',                          image_urls: [IMG.drill]   },
    { id: uid(), name: 'Angle Grinder Set',        category: 'Power Tools',  stock_total: 5,  stock_available: 5, status: 'available', description: '4.5-inch angle grinder with cutting disc, grinding disc, and flap disc. Perfect for steel fabrication.',                    image_urls: [IMG.grinder] },
    { id: uid(), name: 'Arc Welding Machine',      category: 'Welding',      stock_total: 3,  stock_available: 3, status: 'available', description: '250A IGBT inverter welding machine. Lightweight and portable. Includes electrode holder and ground clamp.',                  image_urls: [IMG.welder]  },
    { id: uid(), name: 'Chain Block 3-Ton',        category: 'Lifting',      stock_total: 2,  stock_available: 2, status: 'available', description: '3-ton manual chain hoist with 3-meter lift. Used for heavy lifting in construction and industrial settings.',                image_urls: [IMG.chain]   },
    { id: uid(), name: 'Diesel Water Pump 3"',     category: 'Pumping',      stock_total: 2,  stock_available: 1, status: 'available', description: '3-inch diesel water pump with 500–700 GPM flow rate. Used for dewatering excavations and flood control.',                   image_urls: [IMG.pump]    },
  ].map(e => ({ ...e, organization_id: ORG_ID, branch_id: BRANCH_ID }));

  const equipment = await insert('equipment', eqRows);
  const eq = Object.fromEntries(equipment.map(e => [e.name, e]));
  console.log(`   ✅ ${equipment.length} equipment`);

  // ── Pricing Tiers ─────────────────────────────────────────────────────────
  console.log('💰 Inserting pricing tiers…');
  const tierRows = [
    // Generator 5kVA
    { equipment_id: eq['Yamaha 5kVA Generator'].id,    name: 'Daily Rate',   unit: 'day',   price: 800,  min_units: 1, is_default: true  },
    { equipment_id: eq['Yamaha 5kVA Generator'].id,    name: 'Weekly Rate',  unit: 'week',  price: 4500, min_units: 1, is_default: false },
    // Generator 10kVA
    { equipment_id: eq['Honda 10kVA Generator'].id,    name: 'Daily Rate',   unit: 'day',   price: 1500, min_units: 1, is_default: true  },
    { equipment_id: eq['Honda 10kVA Generator'].id,    name: 'Weekly Rate',  unit: 'week',  price: 8500, min_units: 1, is_default: false },
    // Concrete Mixer
    { equipment_id: eq['Concrete Mixer 350L'].id,      name: 'Daily Rate',   unit: 'day',   price: 600,  min_units: 1, is_default: true  },
    { equipment_id: eq['Concrete Mixer 350L'].id,      name: 'Weekly Rate',  unit: 'week',  price: 3500, min_units: 1, is_default: false },
    // Scaffolding
    { equipment_id: eq['Scaffolding Set (1 Floor)'].id,name: 'Daily Rate',   unit: 'day',   price: 300,  min_units: 1, is_default: true  },
    { equipment_id: eq['Scaffolding Set (1 Floor)'].id,name: 'Weekly Rate',  unit: 'week',  price: 1500, min_units: 1, is_default: false },
    { equipment_id: eq['Scaffolding Set (1 Floor)'].id,name: 'Monthly Rate', unit: 'month', price: 5000, min_units: 1, is_default: false },
    // Pressure Washer
    { equipment_id: eq['Pressure Washer 200 Bar'].id,  name: 'Daily Rate',   unit: 'day',   price: 700,  min_units: 1, is_default: true  },
    { equipment_id: eq['Pressure Washer 200 Bar'].id,  name: 'Weekly Rate',  unit: 'week',  price: 4000, min_units: 1, is_default: false },
    // Rotary Hammer
    { equipment_id: eq['Rotary Hammer Drill'].id,      name: 'Daily Rate',   unit: 'day',   price: 450,  min_units: 1, is_default: true  },
    { equipment_id: eq['Rotary Hammer Drill'].id,      name: 'Weekly Rate',  unit: 'week',  price: 2500, min_units: 1, is_default: false },
    // Angle Grinder
    { equipment_id: eq['Angle Grinder Set'].id,        name: 'Daily Rate',   unit: 'day',   price: 350,  min_units: 1, is_default: true  },
    { equipment_id: eq['Angle Grinder Set'].id,        name: 'Weekly Rate',  unit: 'week',  price: 2000, min_units: 1, is_default: false },
    // Arc Welder
    { equipment_id: eq['Arc Welding Machine'].id,      name: 'Daily Rate',   unit: 'day',   price: 600,  min_units: 1, is_default: true  },
    { equipment_id: eq['Arc Welding Machine'].id,      name: 'Weekly Rate',  unit: 'week',  price: 3500, min_units: 1, is_default: false },
    // Chain Block
    { equipment_id: eq['Chain Block 3-Ton'].id,        name: 'Daily Rate',   unit: 'day',   price: 500,  min_units: 1, is_default: true  },
    { equipment_id: eq['Chain Block 3-Ton'].id,        name: 'Weekly Rate',  unit: 'week',  price: 2800, min_units: 1, is_default: false },
    // Water Pump
    { equipment_id: eq['Diesel Water Pump 3"'].id,     name: 'Daily Rate',   unit: 'day',   price: 800,  min_units: 1, is_default: true  },
    { equipment_id: eq['Diesel Water Pump 3"'].id,     name: 'Weekly Rate',  unit: 'week',  price: 4500, min_units: 1, is_default: false },
  ].map(t => ({ ...t, organization_id: ORG_ID }));

  const tiers = await insert('pricing_tiers', tierRows);
  // default tier per equipment
  const dTier = {};
  for (const t of tiers) { if (t.is_default) dTier[t.equipment_id] = t; }
  console.log(`   ✅ ${tiers.length} pricing tiers`);

  // ── Customers ─────────────────────────────────────────────────────────────
  console.log('👥 Inserting customers…');
  const custRows = [
    { id: uid(), full_name: 'Juan dela Cruz',        phone: '09171234567', email: 'juan.delacruz@gmail.com',  address: '123 Rizal Ave, Caloocan City',       notes: 'Regular contractor client. Always returns on time.' },
    { id: uid(), full_name: 'Maria Santos',          phone: '09281234567', email: 'maria.santos@yahoo.com',   address: '456 Mabini St, Quezon City',         notes: 'Homeowner. Rents for occasional home renovation projects.' },
    { id: uid(), full_name: 'Pedro Reyes',           phone: '09991234567', email: 'p.reyes@outlook.com',      address: '789 Bonifacio St, Marikina City',    notes: 'Foreman at ABC Builders. Trusted long-term client.' },
    { id: uid(), full_name: 'ABC Construction Corp', phone: '028123456',   email: 'ops@abcconstruction.ph',   address: 'Unit 5, Ortigas Center, Pasig City', notes: 'Corporate account. Large volume bookings. Pays via bank transfer.' },
    { id: uid(), full_name: 'Ana Gonzales',          phone: '09151234567', email: 'ana.gonzales@gmail.com',   address: '22 Sampaguita St, Las Piñas City',   notes: null },
    { id: uid(), full_name: 'RJ Construction',       phone: '09061234567', email: 'rj@rjconstruction.ph',     address: 'Lot 8 Phase 2, Antipolo City',       notes: 'Medium-sized general contractor. Reliable payment history.' },
    { id: uid(), full_name: 'Mike Torres',           phone: '09481234567', email: 'mike.torres@gmail.com',    address: '50 Katipunan Ave, Quezon City',      notes: 'Landscaping contractor. Frequently rents drills and grinders.' },
    { id: uid(), full_name: 'Liza Mendoza',          phone: '09221234567', email: 'liza.mendoza@gmail.com',   address: '11 Aurora Blvd, Cubao, QC',          notes: 'Event organizer. Rents generators for corporate events.' },
  ].map(c => ({ ...c, organization_id: ORG_ID, total_bookings: 0, total_spent: 0, is_blacklisted: false }));

  const customers = await insert('customers', custRows);
  const cu = Object.fromEntries(customers.map(c => [c.full_name, c]));
  console.log(`   ✅ ${customers.length} customers`);

  // ── Bookings ──────────────────────────────────────────────────────────────
  console.log('📋 Inserting bookings…');

  // Helper
  function bk(o) {
    return {
      id: uid(), organization_id: ORG_ID, branch_id: BRANCH_ID,
      source: 'walk_in', delivery_type: 'pickup',
      amount_paid: 0, late_fee: 0, subtotal: o.total_amount ?? 0,
      cancel_reason: null, cancelled_at: null, actual_return: null,
      confirmed_at: null, delivery_address: null,
      ...o,
    };
  }

  const B = {};

  // COMPLETED
  B.b1 = bk({ id: uid(), customer_id: cu['Juan dela Cruz'].id,        status: 'completed', booking_number: 'BK-2026-001', start_date: dt(-30), end_date: dt(-23), total_amount: 5600,  dp_amount: 2800,  amount_paid: 5600,  notes: 'Generator for construction site backup power. Returned in good condition.' });
  B.b2 = bk({ id: uid(), customer_id: cu['ABC Construction Corp'].id, status: 'completed', booking_number: 'BK-2026-002', start_date: dt(-25), end_date: dt(-11), total_amount: 21000, dp_amount: 10500, amount_paid: 21000, notes: '5 scaffolding sets for building facade repair project.' });
  B.b3 = bk({ id: uid(), customer_id: cu['Pedro Reyes'].id,           status: 'completed', booking_number: 'BK-2026-003', start_date: dt(-15), end_date: dt(-10), total_amount: 3000,  dp_amount: 1500,  amount_paid: 3000,  notes: 'Slab pouring for house extension.' });
  B.b4 = bk({ id: uid(), customer_id: cu['RJ Construction'].id,       status: 'completed', booking_number: 'BK-2026-004', start_date: dt(-12), end_date: dt(-9),  total_amount: 1800,  dp_amount: 900,   amount_paid: 1800,  notes: 'Steel gate fabrication project.' });

  // ACTIVE
  B.b5 = bk({ id: uid(), customer_id: cu['RJ Construction'].id,       status: 'active',    booking_number: 'BK-2026-005', start_date: dt(-3),  end_date: dt(4),  total_amount: 6300,  dp_amount: 3150, amount_paid: 3150, notes: 'Drilling for anchor bolts on steel structure.' });
  B.b6 = bk({ id: uid(), customer_id: cu['Liza Mendoza'].id,          status: 'active',    booking_number: 'BK-2026-006', start_date: dt(-1),  end_date: dt(4),  total_amount: 7500,  dp_amount: 3750, amount_paid: 3750, notes: 'Corporate event at BGC. Generator for stage and lighting.', delivery_type: 'delivery' });
  B.b7 = bk({ id: uid(), customer_id: cu['ABC Construction Corp'].id, status: 'active',    booking_number: 'BK-2026-007', start_date: dt(-2),  end_date: dt(2),  total_amount: 3200,  dp_amount: 1600, amount_paid: 1600, notes: 'Dewatering for basement excavation.' });

  // CONFIRMED (future)
  B.b8 = bk({ id: uid(), customer_id: cu['Maria Santos'].id,          status: 'confirmed', booking_number: 'BK-2026-008', start_date: dt(3),   end_date: dt(8),  total_amount: 4000,  dp_amount: 2000, amount_paid: 2000, notes: 'Generator for garden party next weekend.' });
  B.b9 = bk({ id: uid(), customer_id: cu['Juan dela Cruz'].id,        status: 'confirmed', booking_number: 'BK-2026-009', start_date: dt(5),   end_date: dt(15), total_amount: 9000,  dp_amount: 4500, amount_paid: 4500, notes: '3 scaffolding sets for painting exterior walls.' });

  // OVERDUE
  B.b10 = bk({ id: uid(), customer_id: cu['Mike Torres'].id,          status: 'overdue',   booking_number: 'BK-2026-010', start_date: dt(-10), end_date: dt(-5), total_amount: 2250,  dp_amount: 1125, amount_paid: 1125, late_fee: 405, notes: 'Customer unreachable. 3 days overdue. Follow up via call.' });

  // CANCELLED
  B.b11 = bk({ id: uid(), customer_id: cu['Ana Gonzales'].id,         status: 'cancelled', booking_number: 'BK-2026-011', start_date: dt(-7),  end_date: dt(-4), total_amount: 1800,  dp_amount: 900,  amount_paid: 0,    notes: 'Customer cancelled due to project delay.', cancel_reason: 'Project delayed' });

  // DRAFT
  B.b12 = bk({ id: uid(), customer_id: cu['Pedro Reyes'].id,          status: 'draft',     booking_number: 'BK-2026-012', start_date: dt(7),   end_date: dt(10), total_amount: 2400,  dp_amount: 1200, amount_paid: 0,    notes: 'Pending confirmation — waiting for customer PO.' });

  const bookingRows = Object.values(B);
  const insertedBks = await insert('bookings', bookingRows);
  console.log(`   ✅ ${insertedBks.length} bookings`);

  // ── Booking Items ─────────────────────────────────────────────────────────
  console.log('📦 Inserting booking items…');
  // Get default tiers shorthand
  const T = (name) => dTier[eq[name].id];

  function item(bid, ename, qty, days) {
    const t  = T(ename);
    const up = t.price;
    return {
      id: uid(), booking_id: bid, equipment_id: eq[ename].id,
      pricing_tier_id: t.id, quantity: qty,
      unit: t.unit, unit_price: up, units_count: days,
      subtotal: up * qty * days,
    };
  }

  const itemRows = [
    item(B.b1.id,  'Yamaha 5kVA Generator',    1, 7),
    item(B.b2.id,  'Scaffolding Set (1 Floor)', 5, 14),
    item(B.b3.id,  'Concrete Mixer 350L',       1, 5),
    item(B.b4.id,  'Arc Welding Machine',       1, 3),
    item(B.b5.id,  'Rotary Hammer Drill',       2, 7),
    item(B.b6.id,  'Honda 10kVA Generator',     1, 5),
    item(B.b7.id,  'Diesel Water Pump 3"',      1, 4),
    item(B.b8.id,  'Yamaha 5kVA Generator',     1, 5),
    item(B.b9.id,  'Scaffolding Set (1 Floor)', 3, 10),
    item(B.b10.id, 'Rotary Hammer Drill',       1, 5),
    item(B.b11.id, 'Concrete Mixer 350L',       1, 3),
    item(B.b12.id, 'Yamaha 5kVA Generator',     1, 3),
  ];
  await insert('booking_items', itemRows);
  console.log(`   ✅ ${itemRows.length} booking items`);

  // ── Payments ──────────────────────────────────────────────────────────────
  console.log('💳 Inserting payments…');
  function pay(bid, type, amount, method, daysAgo = 0) {
    return {
      id: uid(), organization_id: ORG_ID, booking_id: bid,
      type, amount, method, status: 'paid',
      reference_number: 'REF-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      paid_at: new Date(new Date('2026-05-18').getTime() - daysAgo * 86400000).toISOString(),
    };
  }

  const payRows = [
    // B1 completed
    pay(B.b1.id,  'deposit',  2800,  'gcash',         30),
    pay(B.b1.id,  'full',     2800,  'cash',           23),
    // B2 completed
    pay(B.b2.id,  'deposit',  10500, 'bank_transfer',  25),
    pay(B.b2.id,  'full',     10500, 'bank_transfer',  11),
    // B3 completed
    pay(B.b3.id,  'deposit',  1500,  'gcash',          15),
    pay(B.b3.id,  'full',     1500,  'cash',           10),
    // B4 completed
    pay(B.b4.id,  'deposit',  900,   'cash',           12),
    pay(B.b4.id,  'full',     900,   'cash',            9),
    // B5 active (DP only)
    pay(B.b5.id,  'deposit',  3150,  'gcash',           3),
    // B6 active (DP only)
    pay(B.b6.id,  'deposit',  3750,  'bank_transfer',   1),
    // B7 active (DP only)
    pay(B.b7.id,  'deposit',  1600,  'cash',            2),
    // B8 confirmed (DP)
    pay(B.b8.id,  'deposit',  2000,  'gcash',           1),
    // B9 confirmed (DP)
    pay(B.b9.id,  'deposit',  4500,  'gcash',           1),
  ];
  await insert('payments', payRows);
  console.log(`   ✅ ${payRows.length} payments`);

  // ── Update customer stats ─────────────────────────────────────────────────
  console.log('📊 Updating customer stats…');
  const stats = [
    { id: cu['Juan dela Cruz'].id,        total_bookings: 3, total_spent: 5600 + 9000 },
    { id: cu['ABC Construction Corp'].id, total_bookings: 3, total_spent: 21000 + 3200 },
    { id: cu['Pedro Reyes'].id,           total_bookings: 2, total_spent: 3000 },
    { id: cu['RJ Construction'].id,       total_bookings: 2, total_spent: 1800 },
    { id: cu['Liza Mendoza'].id,          total_bookings: 1, total_spent: 0 },
    { id: cu['Maria Santos'].id,          total_bookings: 1, total_spent: 0 },
    { id: cu['Mike Torres'].id,           total_bookings: 1, total_spent: 0 },
    { id: cu['Ana Gonzales'].id,          total_bookings: 1, total_spent: 0 },
  ];
  for (const s of stats) {
    await patch('customers', `id=eq.${s.id}`, { total_bookings: s.total_bookings, total_spent: s.total_spent });
  }
  console.log(`   ✅ Customer stats updated`);

  console.log('\n🎉 Seed complete!');
  console.log(`   Equipment : ${equipment.length} items (10 categories)`);
  console.log(`   Customers : ${customers.length}`);
  console.log(`   Bookings  : 4 completed · 3 active · 2 confirmed · 1 overdue · 1 cancelled · 1 draft`);
  console.log(`   Payments  : ${payRows.length} transactions`);
  console.log('\n   → Open https://nextgen-rentflow.netlify.app to see the data!');
}

main().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });
