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

let inventory = {
  duffle_bag: 0,
  laptop_bag: 0,
  laptop_sleeve: 0,
  try_again: 0
}

let leads = []
let spinsLeft = 1
let wonPrizes = []

// Fetch initial data from Supabase
const initData = async () => {
  try {
    const { data: invData, error: invError } = await supabase.from('inventory').select('*')
    if (invError) throw invError
    
    if (invData && invData.length > 0) {
      invData.forEach(item => {
        inventory[item.id] = item.count
      })
    } else {
      // Default inventory if table is empty
      const initialInv = [
        { id: 'duffle_bag', count: 100, label: 'Heineken Bag' },
        { id: 'laptop_bag', count: 50, label: 'Laptop Case' },
        { id: 'laptop_sleeve', count: 20, label: 'Laptop Sleeve' },
        { id: 'try_again', count: 200, label: 'Try Again' }
      ]
      await supabase.from('inventory').upsert(initialInv)
      initialInv.forEach(item => {
        inventory[item.id] = item.count
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
    <div class="capture-container">
      <h1 id="admin-trigger" style="cursor: default;">PLAY & WIN</h1>
      <p style="font-size: 1.5rem; color: var(--h-green); font-weight: 700; margin-bottom: 5px;">Exclusive Rewards</p>
      <p class="subtitle" style="margin-bottom: 30px;">Enter your details to join the challenge.</p>
      
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
  
  const nameError = document.querySelector('#name-error')
  const phoneError = document.querySelector('#phone-error')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    let isValid = true
    nameError.style.display = 'none'
    phoneError.style.display = 'none'
    
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
      const userData = { 
        name: nameInput.value, 
        phone: phoneValue, 
        prize: 'Pending'
      }
      
      try {
        const { data, error } = await supabase.from('leads').insert([userData]).select()
        if (error) throw error
        
        const registeredUser = data[0]
        
        // Every registration decrements "Try Again" by default
        if (inventory.try_again > 0) {
          inventory.try_again--
          await updateInventory('try_again', inventory.try_again)
        }
        
        handleSuccess(registeredUser)
      } catch (error) {
        console.error('Error saving lead:', error)
        alert('Transaction failed. Please try again.')
      }
    }
  })
}

const updateInventory = async (id, count) => {
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ count })
      .eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error(`Error updating inventory for ${id}:`, error)
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
    <div class="capture-container admin-dashboard-container" style="position: relative;">
      <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 15px;">
        <button class="primary-btn" style="width: auto; padding: 10px 15px; font-size: 0.8rem; background: var(--h-red);" onclick="confirmReset()">Reset All Data</button>
        <button class="primary-btn" style="width: auto; padding: 10px 15px; font-size: 0.8rem;" onclick="exportCSV()">Export CSV</button>
      </div>
      <h1 style="text-align: center; font-size: 3rem; margin-bottom: 40px;">ADMIN DASHBOARD</h1>
      <div class="dashboard-grid">
        <div class="dashboard-panel">
          <h3 style="color: var(--h-green); margin-bottom: 20px;">INVENTORY</h3>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            ${REWARDS.map(r => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">
                <span>${r.label}</span>
                <div style="display: flex; align-items: center; gap: 5px;">
                  <button class="adj-btn" onclick="adjust('${r.id}', -1)">-</button>
                  <input type="number" id="inv-input-${r.id}" value="${inventory[r.id] || 0}" 
                    style="width: 60px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; text-align: center; border-radius: 4px; padding: 5px; font-weight: 800;"
                    onchange="setInventory('${r.id}', this.value)">
                  <button class="adj-btn" onclick="adjust('${r.id}', 1)">+</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="dashboard-panel">
          <h3 style="color: var(--h-green); margin-bottom: 20px;">LEADS (${leads.length})</h3>
          <div style="height: 350px; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="border-bottom: 2px solid var(--h-green);"><th align="left" style="padding: 10px;">Name</th><th align="left" style="padding: 10px;">Phone</th><th align="left" style="padding: 10px;">Prize</th><th align="left" style="padding: 10px;">Date</th></tr></thead>
              <tbody>
                ${leads.map(lead => `<tr><td style="padding: 10px;">${lead.name}</td><td style="padding: 10px;">${lead.phone}</td><td style="padding: 10px; color: ${lead.prize && lead.prize !== 'Try Again' && lead.prize !== 'Pending' ? 'var(--h-green)' : 'rgba(255,255,255,0.4)'}; font-weight: 700;">${lead.prize || 'Pending'}</td><td style="padding: 10px; font-size: 0.7rem;">${new Date(lead.created_at).toLocaleString()}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <button class="primary-btn" style="max-width: 300px;" onclick="location.reload()">Logout Admin</button>
      </div>
    </div>
  `
  window.adjust = async (id, delta) => {
    const input = document.querySelector(`#inv-input-${id}`)
    const newValue = Math.max(0, parseInt(input.value) + delta)
    input.value = newValue
    await setInventory(id, newValue)
  }
  window.setInventory = async (id, value) => {
    const val = Math.max(0, parseInt(value) || 0)
    inventory[id] = val
    await updateInventory(id, val)
  }
  window.exportCSV = () => {
    const leadsHeaders = "Name,Phone,Prize,Timestamp\n";
    const leadsRows = leads.map(l => `"${l.name}","${l.phone}","${l.prize}","${new Date(l.created_at).toLocaleString()}"`).join("\n");
    const invHeaders = "\n\nItem,Quantity\n";
    const invRows = REWARDS.map(r => `"${r.label}","${inventory[r.id] || 0}"`).join("\n");
    
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
      <p>Are you sure you want to delete all leads and reset inventory? This cannot be undone.</p>
      <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
        <button id="do-reset" class="primary-btn" style="background: var(--h-red);">RESET ALL</button>
        <button id="cancel-reset" class="primary-btn" style="background: #666;">CANCEL</button>
      </div>
    `
    document.body.appendChild(confirmOverlay)
    
    document.querySelector('#do-reset').onclick = async () => {
      try {
        await supabase.from('leads').delete().neq('id', 0) // Delete all leads
        const resetInv = [
          { id: 'duffle_bag', count: 100 },
          { id: 'laptop_bag', count: 50 },
          { id: 'laptop_sleeve', count: 20 },
          { id: 'try_again', count: 200 }
        ]
        for (const item of resetInv) {
          await updateInventory(item.id, item.count)
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
      <div class="footer-note">Participant: ${userData.name}</div>
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

  // Only items with stock > 0 can be won
  const availableWinItems = REWARDS.slice(0, 3).filter(r => inventory[r.id] > 0)
  const canWin = wonPrizes.length === 0 && availableWinItems.length > 0

  // Win probability = prize stock / (prize stock + try_again stock)
  const totalPrizeStock = availableWinItems.reduce((sum, r) => sum + inventory[r.id], 0)
  const tryAgainStock = Math.max(inventory.try_again || 0, 0)
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
      rand -= inventory[r.id]
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
    
    // Update lead prize record in Supabase
    const finalPrize = isWin ? result[0].label : 'Try Again'
    try {
      await supabase
        .from('leads')
        .update({ prize: finalPrize })
        .eq('id', userData.id)
    } catch (err) {
      console.error('Error updating prize:', err)
    }

    if (isWin) {
      wonPrizes.push(result[0])
      if (inventory[result[0].id] > 0) {
        inventory[result[0].id]--
        await updateInventory(result[0].id, inventory[result[0].id])
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
