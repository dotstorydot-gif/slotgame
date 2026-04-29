import './style.css'
import { supabase } from './supabase'

const app = document.querySelector('#app')

// Rewards & Icons
const REWARDS = [
  { id: 'duffle_bag', label: 'Heineken Bag', icon: '/assets/Heinken-Bag.png', type: 'image' },
  { id: 'laptop_bag', label: 'Laptop Case', icon: '/assets/Laptop-case.png', type: 'image' },
  { id: 'laptop_sleeve', label: 'Laptop Sleeve', icon: '/assets/Laptop-Sleeve.png', type: 'image' },
  { id: 'try_again', label: 'Try Again', icon: '/try_again.png', type: 'image' }
]

let inventory = {}
const VENUES = [
  'Le Méridien Airport', 
  'Buffalo Wings & Rings', 
  'The Villa Hub',
  'JW Mariott Mirage - Plato',
  'Westin Dunes',
  'The Tap East',
  'Amici West',
  'Tipsy Camal',
  'Zouni El gouna',
  'Rush El Gouna',
  'Chez Geuvara Hurghda',
  'Las Vegas Hurghada',
  'London Bridge Hurghada',
  'Waves Hurghada'
]
let currentAdminVenue = VENUES[0]

let leads = []
let spinsLeft = 1
let wonPrizes = []

// Offline Storage Helpers
const getOfflineLeads = () => JSON.parse(localStorage.getItem('offline_leads') || '[]')
const saveOfflineLead = (lead) => {
  const offline = getOfflineLeads()
  offline.push({ ...lead, id: lead.id || `local_${Date.now()}`, is_local: true })
  localStorage.setItem('offline_leads', JSON.stringify(offline))
}
const clearOfflineLeads = () => localStorage.removeItem('offline_leads')

const syncOfflineData = async () => {
  const offline = getOfflineLeads()
  const offlineInv = JSON.parse(localStorage.getItem('offline_inv') || '[]')
  
  if (offline.length === 0 && offlineInv.length === 0) return 0
  
  let syncedCount = 0
  // Sync Leads
  for (const lead of offline) {
    try {
      const { is_local, ...dbData } = lead
      if (typeof lead.id === 'string' && lead.id.startsWith('local_')) {
        const { id, ...insertData } = dbData
        await supabase.from('leads').insert([insertData])
      } else {
        await supabase.from('leads').update(dbData).eq('id', lead.id)
      }
      syncedCount++
    } catch (err) { console.error('Lead sync failed:', err) }
  }
  
  // Sync Inventory
  for (const inv of offlineInv) {
    try {
      await supabase.from('inventory').upsert(inv)
    } catch (err) { console.error('Inv sync failed:', err) }
  }
  
  if (syncedCount === offline.length) clearOfflineLeads()
  localStorage.removeItem('offline_inv')
  return syncedCount
}

// Save inventory update locally if offline
const saveOfflineInv = (id, count, venue) => {
  const offline = JSON.parse(localStorage.getItem('offline_inv') || '[]')
  offline.push({ id, count, venue, label: REWARDS.find(r => r.id === id)?.label || id })
  localStorage.setItem('offline_inv', JSON.stringify(offline))
}

// Fetch initial data from Supabase
const initData = async () => {
  // Auto-sync if online
  if (navigator.onLine) syncOfflineData()
  
  try {
    const { data: invData, error: invError } = await supabase.from('inventory').select('*')
    if (invError) throw invError
    
    if (invData && invData.length > 0) {
      // Group inventory by venue
      inventory = {}
      invData.forEach(item => {
        if (!inventory[item.venue]) inventory[item.venue] = {}
        inventory[item.venue][item.id] = item.count
      })
    } else {
      // Fallback if table is empty (should be handled by SQL seed)
      inventory = {}
      VENUES.forEach(v => {
        inventory[v] = { duffle_bag: 100, laptop_bag: 50, laptop_sleeve: 20, try_again: 200 }
      })
    }

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (leadError) throw leadError
    leads = leadData || []
  } catch (error) {
    console.error('Error initializing data:', error)
  }
}

// Add bubbles to background
const createBubbles = () => {
  const container = document.createElement('div')
  container.className = 'bubbles'
  for (let i = 0; i < 20; i++) {
    const bubble = document.createElement('div')
    bubble.className = 'bubble'
    const size = Math.random() * 20 + 10
    bubble.style.width = `${size}px`
    bubble.style.height = `${size}px`
    bubble.style.left = `${Math.random() * 100}%`
    bubble.style.animationDuration = `${Math.random() * 5 + 5}s`
    bubble.style.animationDelay = `${Math.random() * 5}s`
    container.appendChild(bubble)
  }
  document.body.appendChild(container)
}

const renderCaptureForm = () => {
  app.innerHTML = `
    <div class="main-headline">FANS HAVE<br>MORE FRIENDS</div>
    <div class="capture-container">
      <h1 id="admin-trigger" style="cursor: default; font-size: 2rem;">PLAY & WIN</h1>
      <p style="font-size: 1.2rem; color: var(--h-green); font-weight: 700; margin-bottom: 5px;">Exclusive Rewards</p>
      <p class="subtitle">Enter your details to join the challenge.</p>
      
      <form id="lead-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" placeholder="Enter your name" required>
          <div id="name-error" class="error-msg">Please enter your name</div>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" placeholder="01X XXXX XXXX" required>
          <div id="phone-error" class="error-msg">Please enter a valid Egyptian phone number</div>
        </div>
        
        <div class="form-group">
          <label for="venue">Venue</label>
          <select id="venue" required>
            <option value="" disabled selected>Select Venue</option>
            ${VENUES.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
          <div id="venue-error" class="error-msg">Please select a venue</div>
        </div>
        
        <div class="checkbox-group">
          <input type="checkbox" id="terms" required>
          <label for="terms">I agree to the Terms & Conditions.</label>
        </div>
        
        <button type="submit" class="primary-btn">Let's Play</button>
      </form>
      
      <div class="footer-note">Enjoy Heineken Responsibly.</div>
    </div>
  `

  let clickCount = 0
  document.querySelector('#admin-trigger').addEventListener('click', () => {
    clickCount++
    if (clickCount >= 5) {
      clickCount = 0
      renderAdminLogin()
    }
  })

  const form = document.querySelector('#lead-form')
  const nameInput = document.querySelector('#name')
  const phoneInput = document.querySelector('#phone')
  const venueInput = document.querySelector('#venue')
  
  const nameError = document.querySelector('#name-error')
  const phoneError = document.querySelector('#phone-error')
  const venueError = document.querySelector('#venue-error')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    let isValid = true
    nameError.style.display = 'none'
    phoneError.style.display = 'none'
    venueError.style.display = 'none'
    
    if (!nameInput.value.trim()) {
      nameError.style.display = 'block'
      isValid = false
    }
    
    const phoneValue = phoneInput.value.replace(/\s+/g, '')
    const egyptPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/
    
    if (!egyptPhoneRegex.test(phoneValue)) {
      phoneError.style.display = 'block'
      isValid = false
    }
    
    if (isValid) {
      if (!venueInput.value) {
        venueError.style.display = 'block'
        isValid = false
      }
    }
    
    if (isValid) {
      const userData = { 
        name: nameInput.value, 
        phone: phoneValue, 
        venue: venueInput.value
      }
      
      // Move to slot machine without saving to DB yet (to avoid 'Pending' status)
      handleSuccess(userData)
    }
  })
}

const updateInventory = async (id, count, venue) => {
  try {
    const { error } = await supabase
      .from('inventory')
      .upsert({ id, venue, count, label: REWARDS.find(r => r.id === id)?.label || id })
    if (error) throw error
  } catch (error) {
    console.error(`Error updating inventory:`, error)
    saveOfflineInv(id, count, venue)
  }
}

const decrementInventory = async (id, venue) => {
  try {
    const { error } = await supabase.rpc('decrement_inventory', { p_id: id, p_venue: venue })
    if (error) throw error
  } catch (error) {
    console.error(`Error decrementing inventory:`, error)
    // Fallback to manual decrement if RPC fails or is missing
    if (inventory[venue] && inventory[venue][id] > 0) {
      await updateInventory(id, inventory[venue][id] - 1, venue)
    }
  }
}

const renderAdminLogin = () => {
  app.innerHTML = `
    <div class="capture-container admin-login-body">
      <h1 class="admin-header">ADMIN ENTRY</h1>
      <form id="admin-login-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="admin-user" placeholder="Enter username" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="admin-pass" placeholder="••••••••" required>
        </div>
        <div id="login-error" class="error-msg" style="margin-bottom: 20px;">Invalid credentials</div>
        <button type="submit" class="primary-btn">Login</button>
        <button type="button" class="primary-btn" style="background: #333; margin-top: 10px;" onclick="location.reload()">Back</button>
      </form>
    </div>
  `

  document.querySelector('#admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const user = document.querySelector('#admin-user').value
    const pass = document.querySelector('#admin-pass').value
    if (user === 'admin' && pass === '123456') {
      renderAdminDashboard()
    } else {
      document.querySelector('#login-error').style.display = 'block'
    }
  })
}

const renderAdminDashboard = async () => {
  await initData() // Refresh data
  app.innerHTML = `
    <div class="capture-container admin-dashboard-container">
      <div class="admin-actions">
        <button class="primary-btn sync-btn" onclick="handleAdminSync()">Sync Offline (${getOfflineLeads().length})</button>
        <button class="primary-btn reset-btn" onclick="confirmReset()">Reset All</button>
        <button class="primary-btn export-btn" onclick="exportCSV()">Export CSV</button>
      </div>
      <h1 class="admin-title">DASHBOARD</h1>
      <div class="venue-switcher">
        ${VENUES.map(v => `
          <button class="venue-btn ${currentAdminVenue === v ? 'active' : ''}" 
            onclick="switchVenue('${v}')">${v}</button>
        `).join('')}
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-panel">
          <h3 class="panel-title">Stock: ${currentAdminVenue}</h3>
          <div class="inventory-list">
            ${REWARDS.map(r => `
              <div class="inventory-row">
                <span class="item-label">${r.label}</span>
                <div class="inventory-controls">
                  <button class="adj-btn" onclick="adjust('${r.id}', -1)">-</button>
                  <input type="number" id="inv-input-${r.id}" value="${(inventory[currentAdminVenue] && inventory[currentAdminVenue][r.id]) || 0}" 
                    class="inv-input"
                    onchange="setInventory('${r.id}', this.value)">
                  <button class="adj-btn" onclick="adjust('${r.id}', 1)">+</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="dashboard-panel">
          <div class="leads-header">
            <h3 class="panel-title">LEADS (${leads.filter(l => l.venue === currentAdminVenue).length})</h3>
          </div>
          <div class="leads-table-container">
            <table class="leads-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Prize</th><th>Date</th></tr></thead>
              <tbody>
                ${leads.filter(l => l.venue === currentAdminVenue).map(lead => `
                  <tr>
                    <td>${lead.name}</td>
                    <td>${lead.phone}</td>
                    <td style="color: ${lead.prize && lead.prize !== 'Try Again' && lead.prize !== 'Pending' ? 'var(--h-green)' : 'rgba(255,255,255,0.4)'}; font-weight: 700;">${lead.prize || 'Pending'}</td>
                    <td class="lead-date">${new Date(lead.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <button class="primary-btn logout-btn" onclick="location.reload()">Logout Admin</button>
      </div>
    </div>
  `
  window.switchVenue = (v) => {
    currentAdminVenue = v
    renderAdminDashboard()
  }
  window.adjust = async (id, delta) => {
    const input = document.querySelector(`#inv-input-${id}`)
    const newValue = Math.max(0, parseInt(input.value) + delta)
    input.value = newValue
    await setInventory(id, newValue)
  }
  window.handleAdminSync = async () => {
    const btn = document.querySelector('.sync-btn')
    btn.textContent = 'Syncing...'
    const count = await syncOfflineData()
    alert(`Synced ${count} offline leads!`)
    renderAdminDashboard()
  }
  
  window.setInventory = async (id, value) => {
    const val = Math.max(0, parseInt(value) || 0)
    if (!inventory[currentAdminVenue]) inventory[currentAdminVenue] = {}
    inventory[currentAdminVenue][id] = val
    
    // Visual feedback
    const input = document.querySelector(`#inv-input-${id}`)
    if (input) {
      input.style.borderColor = 'var(--h-green)'
      input.style.boxShadow = '0 0 10px var(--h-green)'
      setTimeout(() => {
        input.style.borderColor = 'rgba(255,255,255,0.2)'
        input.style.boxShadow = 'none'
      }, 500)
    }
    
    await updateInventory(id, val, currentAdminVenue)
  }
  window.exportCSV = () => {
    const leadsHeaders = "Name,Phone,Venue,Prize,Timestamp\n";
    const leadsRows = leads.map(l => `"${l.name}","${l.phone}","${l.venue || '-'}","${l.prize}","${new Date(l.created_at).toLocaleString()}"`).join("\n");
    const invHeaders = "\n\nItem,Quantity\n";
    const invRows = REWARDS.map(r => `"${r.label}","${inventory[currentAdminVenue] ? inventory[currentAdminVenue][r.id] : 0}"`).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + leadsHeaders + leadsRows + invHeaders + invRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ucl_slot_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  window.confirmReset = () => {
    const confirmOverlay = document.createElement('div')
    confirmOverlay.className = 'game-message active'
    confirmOverlay.style.zIndex = '1000'
    confirmOverlay.innerHTML = `
      <h2 style="color: var(--h-red);">WARNING!</h2>
      <p>Are you sure you want to delete all leads and reset inventory for ALL venues? This cannot be undone.</p>
      <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
        <button id="do-reset" class="primary-btn" style="background: var(--h-red);">RESET ALL</button>
        <button id="cancel-reset" class="primary-btn" style="background: #666;">CANCEL</button>
      </div>
    `
    document.body.appendChild(confirmOverlay)
    
    document.querySelector('#do-reset').onclick = async () => {
      try {
        await supabase.from('leads').delete().neq('id', 0) // Delete all leads
        for (const v of VENUES) {
          const resetInv = [
            { id: 'duffle_bag', count: 100 },
            { id: 'laptop_bag', count: 50 },
            { id: 'laptop_sleeve', count: 20 },
            { id: 'try_again', count: 200 }
          ]
          for (const item of resetInv) {
            await updateInventory(item.id, item.count, v)
          }
        }
        location.reload()
      } catch (err) {
        console.error(err)
      }
    }
    document.querySelector('#cancel-reset').onclick = () => {
      document.body.removeChild(confirmOverlay)
    }
  }
}

const renderSlotMachine = (userData) => {
  app.innerHTML = `
    <div class="slot-screen">
      <h1 class="slot-title">SPIN & WIN</h1>
      <p class="subtitle">Match 3 premium items to win exclusive UCL rewards!</p>
      <div class="slot-machine">
        <div class="slot-frame">
          <div class="reels-container">
            <div class="glass-overlay"></div>
            <div class="reel" id="reel-1"><div class="reel-content"><div class="reel-item"><img src="${REWARDS[0].icon}"></div></div></div>
            <div class="reel" id="reel-2"><div class="reel-content"><div class="reel-item"><img src="${REWARDS[1].icon}"></div></div></div>
            <div class="reel" id="reel-3"><div class="reel-content"><div class="reel-item"><img src="${REWARDS[2].icon}"></div></div></div>
          </div>
        </div>
        <div class="spin-count">Spins Remaining: <span id="count">${spinsLeft}</span></div>
        <button id="spin-btn" class="primary-btn" style="max-width: 300px; font-size: 1.5rem; padding: 20px;">SPIN</button>
      </div>
      <div class="footer-note">Participant: ${userData.name} | Venue: ${userData.venue}</div>
      <div id="game-message" class="game-message">
        <h2 id="msg-title">CONGRATULATIONS!</h2>
        <p id="msg-body">You've won a prize!</p>
        <button id="msg-btn" class="primary-btn" style="margin-top: 20px;">Spin Again</button>
      </div>
    </div>
  `
  document.querySelector('#spin-btn').addEventListener('click', () => {
    if (spinsLeft > 0) handleSpin(userData)
  })
}

const handleSpin = async (userData) => {
  const spinBtn = document.querySelector('#spin-btn')
  spinBtn.disabled = true
  spinsLeft--
  document.querySelector('#count').textContent = spinsLeft

  // Sync inventory before spin to ensure accurate odds
  await initData()

  // Use inventory for the user's specific venue
  const venueInv = inventory[userData.venue] || { duffle_bag: 0, laptop_bag: 0, laptop_sleeve: 0, try_again: 0 }

  // Only items with stock > 0 can be won
  const availableWinItems = REWARDS.slice(0, 3).filter(r => venueInv[r.id] > 0)
  const canWin = wonPrizes.length === 0 && availableWinItems.length > 0

  // Win probability based on venue stock
  const totalPrizeStock = availableWinItems.reduce((sum, r) => sum + (venueInv[r.id] || 0), 0)
  const tryAgainStock = Math.max(venueInv.try_again || 0, 0)
  const totalStock = totalPrizeStock + tryAgainStock
  const winProbability = totalStock > 0 ? totalPrizeStock / totalStock : 0

  const result = [
    REWARDS[Math.floor(Math.random() * (REWARDS.length - 1))],
    REWARDS[Math.floor(Math.random() * (REWARDS.length - 1))],
    REWARDS[Math.floor(Math.random() * (REWARDS.length - 1))]
  ]

  if (canWin && Math.random() < winProbability) {
    let rand = Math.random() * totalPrizeStock
    let winItem = availableWinItems[0]
    for (const r of availableWinItems) {
      rand -= venueInv[r.id]
      if (rand <= 0) { winItem = r; break }
    }
    result[0] = result[1] = result[2] = winItem
  }

  const reels = [
    document.querySelector('#reel-1 .reel-content'),
    document.querySelector('#reel-2 .reel-content'),
    document.querySelector('#reel-3 .reel-content')
  ]

  reels.forEach((reel, index) => {
    let content = ''
    const spinItems = 30
    for (let i = 0; i < spinItems; i++) {
      const item = REWARDS[Math.floor(Math.random() * 3)]
      content += `<div class="reel-item">${item.type === 'image' ? `<img src="${item.icon}">` : item.icon}</div>`
    }
    content += `<div class="reel-item">${result[index].type === 'image' ? `<img src="${result[index].icon}">` : result[index].icon}</div>`
    reel.innerHTML = content
    reel.style.transition = 'none'
    reel.style.transform = 'translateY(0)'
    setTimeout(() => {
      reel.style.transition = `transform ${3 + index * 0.5}s cubic-bezier(0.68, -0.55, 0.265, 1.35)`
      // The translation value should match the reel item height in CSS
      const itemHeight = document.querySelector('.reel-item').getBoundingClientRect().height
      reel.style.transform = `translateY(-${spinItems * itemHeight}px)`
    }, 50)
  })

  setTimeout(async () => {
    const isWin = result[0].id === result[1].id && result[1].id === result[2].id && result[0].id !== 'try_again'
    
    // Save the full lead (User + Prize) to Supabase now that game is complete
    const finalPrize = isWin ? result[0].label : 'Try Again'
    const fullLeadData = {
      name: userData.name,
      phone: userData.phone,
      venue: userData.venue,
      prize: finalPrize
    }

    try {
      const { error } = await supabase.from('leads').insert([fullLeadData])
      if (error) throw error
      
      // Decrement "Try Again" or Prize stock
      if (isWin) {
        wonPrizes.push(result[0])
        if (inventory[userData.venue] && inventory[userData.venue][result[0].id] > 0) {
          inventory[userData.venue][result[0].id]--
          await decrementInventory(result[0].id, userData.venue)
        }
      } else {
        if (inventory[userData.venue] && inventory[userData.venue].try_again > 0) {
          inventory[userData.venue].try_again--
          await decrementInventory('try_again', userData.venue)
        }
      }
    } catch (err) {
      console.error('Error saving finalized lead:', err)
      // Offline Fallback
      saveOfflineLead({ ...fullLeadData, created_at: new Date().toISOString() })
      alert('Game saved locally (Offline Mode). Please sync later.')
    }
      
      showMessage('CONGRATULATIONS!', `You've won a ${result[0].label}!`, spinsLeft > 0 ? 'Spin Again' : 'View Prizes', () => {
        if (spinsLeft > 0) { hideMessage(); spinBtn.disabled = false }
        else { renderFinalWinningScreen() }
      })
    } else {
      if (spinsLeft === 0) {
        if (wonPrizes.length > 0) renderFinalWinningScreen()
        else showMessage('BETTER LUCK NEXT TIME!', 'No matches this time. Thank you for playing!', 'Finish', () => location.reload())
      } else {
        spinBtn.disabled = false
      }
    }
  }, 4500)
}

const showMessage = (title, body, btnText, callback) => {
  const overlay = document.querySelector('#game-message')
  document.querySelector('#msg-title').textContent = title
  document.querySelector('#msg-body').textContent = body
  const btn = document.querySelector('#msg-btn')
  btn.textContent = btnText
  const newBtn = btn.cloneNode(true)
  btn.parentNode.replaceChild(newBtn, btn)
  newBtn.addEventListener('click', callback)
  overlay.classList.add('active')
}

const hideMessage = () => document.querySelector('#game-message').classList.remove('active')

const renderFinalWinningScreen = () => {
  app.innerHTML = `
    <div class="capture-container winning-container" style="max-width: 700px;">
      <h1>CONGRATULATIONS!</h1>
      <p class="subtitle">Here are the rewards you've secured:</p>
      <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin: 40px 0;">
        ${wonPrizes.map(p => `<div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 20px; border: 2px solid var(--h-green); min-width: 150px;"><img src="${p.icon}" style="width: 80px; height: 80px; object-fit: contain;"><p style="font-weight: 700; margin-top: 10px;">${p.label}</p></div>`).join('')}
      </div>
      <button class="primary-btn" onclick="location.reload()">Claim All Prizes</button>
      <div class="footer-note" style="margin-top: 40px;">Show this to the coordinator.</div>
    </div>
  `
}

const handleSuccess = (userData) => {
  const container = document.querySelector('.capture-container')
  container.style.opacity = '0'
  container.style.transform = 'translateY(20px)'
  setTimeout(() => renderSlotMachine(userData), 500)
}

// Initialize
createBubbles()
initData().then(() => {
  renderCaptureForm()
})
