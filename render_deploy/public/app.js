var currentCategory = null;
var currentProduct = null;
var selectedOptions = {};
var currentPrice = 0;
var activeFilter = 'all';
var configModeOpen = false;

var creditsData = [
  { name: 'None', role: 'Project Lead', id: '00000000000', image: '', desc: 'Error' },
  { name: 'None', role: 'UI/UX Designer', id: '00000000000', image: '', desc: 'Error' },
  { name: 'None', role: 'Frontend Dev', id: '00000000000', image: '', desc: 'Error' }
];

var userProfile = {
  name: 'สมชาย สายคอม',
  email: 'somchai.pc@gmail.com',
  phone: '081-234-5678',
  address: '123/45 หมู่ 3 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
  level: 'V.I.P Member'
};

var orderHistory = [];

var products = {
  pc: [
    {
      id: 'pc1', name: 'Titan Pro X', cat: 'pc',
      spec: 'Intel i9-14900K • RTX 4090 • 64GB DDR5',
      image: 'images/gaming_pc.png',
      basePrice: 89900,
      options: {
        'RAM': ['32GB DDR5', '64GB DDR5', '128GB DDR5'],
        'Storage': ['1TB NVMe', '2TB NVMe', '4TB NVMe'],
        'Cooling': ['Air Cooling', 'AIO 240mm', 'AIO 360mm']
      },
      optionPrices: {
        'RAM': { '32GB DDR5': 0, '64GB DDR5': 6000, '128GB DDR5': 18000 },
        'Storage': { '1TB NVMe': 0, '2TB NVMe': 3000, '4TB NVMe': 9000 },
        'Cooling': { 'Air Cooling': 0, 'AIO 240mm': 2500, 'AIO 360mm': 4500 }
      }
    },
    {
      id: 'pc2', name: 'Storm Elite', cat: 'pc',
      spec: 'Intel i7-14700K • RTX 4080 Super • 32GB DDR5',
      image: 'images/gaming_pc.png',
      basePrice: 64900,
      options: {
        'RAM': ['16GB DDR5', '32GB DDR5', '64GB DDR5'],
        'Storage': ['512GB NVMe', '1TB NVMe', '2TB NVMe'],
        'Cooling': ['Air Cooling', 'AIO 240mm']
      },
      optionPrices: {
        'RAM': { '16GB DDR5': 0, '32GB DDR5': 3000, '64GB DDR5': 8000 },
        'Storage': { '512GB NVMe': 0, '1TB NVMe': 1800, '2TB NVMe': 4500 },
        'Cooling': { 'Air Cooling': 0, 'AIO 240mm': 2200 }
      }
    },
    {
      id: 'pc3', name: 'Budget Blitz', cat: 'pc',
      spec: 'AMD Ryzen 5 7600 • RTX 4060 Ti • 16GB DDR5',
      image: 'images/gaming_pc.png',
      basePrice: 32900,
      options: {
        'RAM': ['16GB DDR5', '32GB DDR5'],
        'Storage': ['512GB NVMe', '1TB NVMe'],
        'Cooling': ['Air Cooling', 'AIO 240mm']
      },
      optionPrices: {
        'RAM': { '16GB DDR5': 0, '32GB DDR5': 2800 },
        'Storage': { '512GB NVMe': 0, '1TB NVMe': 1500 },
        'Cooling': { 'Air Cooling': 0, 'AIO 240mm': 2000 }
      }
    }
  ],
  laptop: [
    {
      id: 'lt1', name: 'Phantom 17 Pro', cat: 'laptop',
      spec: 'Intel i9-14900HX • RTX 4090 • 17.3" 240Hz',
      image: 'images/gaming_laptop.png',
      basePrice: 94900,
      options: {
        'RAM': ['32GB DDR5', '64GB DDR5'],
        'Storage': ['1TB NVMe', '2TB NVMe'],
        'Display': ['QHD 240Hz', '4K 120Hz']
      },
      optionPrices: {
        'RAM': { '32GB DDR5': 0, '64GB DDR5': 8000 },
        'Storage': { '1TB NVMe': 0, '2TB NVMe': 4000 },
        'Display': { 'QHD 240Hz': 0, '4K 120Hz': 6000 }
      }
    },
    {
      id: 'lt2', name: 'Swift X15', cat: 'laptop',
      spec: 'AMD Ryzen 9 8945HS • RTX 4070 • 15.6" 165Hz',
      image: 'images/gaming_laptop.png',
      basePrice: 54900,
      options: {
        'RAM': ['16GB DDR5', '32GB DDR5'],
        'Storage': ['512GB NVMe', '1TB NVMe'],
        'Display': ['FHD 165Hz', 'QHD 165Hz']
      },
      optionPrices: {
        'RAM': { '16GB DDR5': 0, '32GB DDR5': 3200 },
        'Storage': { '512GB NVMe': 0, '1TB NVMe': 2000 },
        'Display': { 'FHD 165Hz': 0, 'QHD 165Hz': 4500 }
      }
    },
    {
      id: 'lt3', name: 'Lite Book 14', cat: 'laptop',
      spec: 'Intel i5-1340P • Intel Iris Xe • 14" FHD',
      image: 'images/gaming_laptop.png',
      basePrice: 22900,
      options: {
        'RAM': ['8GB DDR4', '16GB DDR4'],
        'Storage': ['256GB NVMe', '512GB NVMe'],
        'Color': ['Silver', 'Space Gray']
      },
      optionPrices: {
        'RAM': { '8GB DDR4': 0, '16GB DDR4': 1500 },
        'Storage': { '256GB NVMe': 0, '512GB NVMe': 1200 },
        'Color': { 'Silver': 0, 'Space Gray': 0 }
      }
    }
  ],
  gpu: [
    {
      id: 'gp1', name: 'NVIDIA RTX 4090', cat: 'gpu',
      spec: '24GB GDDR6X • 16384 CUDA Cores • 450W TDP',
      image: 'images/graphics_card.png',
      basePrice: 62900,
      options: {
        'Brand': ['ASUS ROG Strix', 'MSI Suprim X', 'Gigabyte Aorus'],
        'Warranty': ['3 Years', '5 Years']
      },
      optionPrices: {
        'Brand': { 'ASUS ROG Strix': 0, 'MSI Suprim X': 2000, 'Gigabyte Aorus': 1000 },
        'Warranty': { '3 Years': 0, '5 Years': 5000 }
      }
    },
    {
      id: 'gp2', name: 'NVIDIA RTX 4080 Super', cat: 'gpu',
      spec: '16GB GDDR6X • 10240 CUDA Cores • 320W TDP',
      image: 'images/graphics_card.png',
      basePrice: 42900,
      options: {
        'Brand': ['ASUS TUF', 'MSI Gaming X', 'Zotac Trinity'],
        'Warranty': ['3 Years', '5 Years']
      },
      optionPrices: {
        'Brand': { 'Zotac Trinity': -1000, 'ASUS TUF': 0, 'MSI Gaming X': 1000 },
        'Warranty': { '3 Years': 0, '5 Years': 4000 }
      }
    },
    {
      id: 'gp3', name: 'NVIDIA RTX 4060 Ti', cat: 'gpu',
      spec: '8GB GDDR6 • 4352 CUDA Cores • 160W TDP',
      image: 'images/graphics_card.png',
      basePrice: 16900,
      options: {
        'Brand': ['ASUS Dual', 'MSI Ventus', 'Gigabyte Eagle'],
        'Warranty': ['3 Years', '5 Years']
      },
      optionPrices: {
        'Brand': { 'Gigabyte Eagle': -1000, 'MSI Ventus': -400, 'ASUS Dual': 0 },
        'Warranty': { '3 Years': 0, '5 Years': 3000 }
      }
    }
  ],
  ram: [
    {
      id: 'ram1', name: 'Kingston FURY Beast RGB DDR5', cat: 'ram',
      spec: 'Speed Up to 6000MHz • Intel XMP 3.0 & AMD EXPO • RGB Lighting',
      image: 'images/ram.png',
      basePrice: 2490,
      options: {
        'Capacity': ['16GB (8x2)', '32GB (16x2)', '64GB (32x2)'],
        'Speed': ['5200MHz', '6000MHz', '6400MHz'],
        'Color': ['Black RGB', 'White RGB']
      },
      optionPrices: {
        'Capacity': { '16GB (8x2)': 0, '32GB (16x2)': 2200, '64GB (32x2)': 6500 },
        'Speed': { '5200MHz': 0, '6000MHz': 500, '6400MHz': 1200 },
        'Color': { 'Black RGB': 0, 'White RGB': 300 }
      }
    },
    {
      id: 'ram2', name: 'Corsair Vengeance RGB DDR5', cat: 'ram',
      spec: 'DDR5 Gaming RAM • Dynamic Ten-Zone RGB • Aluminum Heatspreader',
      image: 'images/ram.png',
      basePrice: 3290,
      options: {
        'Capacity': ['32GB (16x2)', '64GB (32x2)', '96GB (48x2)'],
        'Speed': ['6000MHz', '6600MHz', '7200MHz'],
        'Color': ['Black', 'White']
      },
      optionPrices: {
        'Capacity': { '32GB (16x2)': 0, '64GB (32x2)': 4800, '96GB (48x2)': 11500 },
        'Speed': { '6000MHz': 0, '6600MHz': 900, '7200MHz': 2100 },
        'Color': { 'Black': 0, 'White': 400 }
      }
    },
    {
      id: 'ram3', name: 'G.SKILL Trident Z5 RGB DDR5', cat: 'ram',
      spec: 'Extreme Speed Performance • Sleek Aluminum Heatspreader • Award Winning',
      image: 'images/ram.png',
      basePrice: 4590,
      options: {
        'Capacity': ['32GB (16x2)', '64GB (32x2)', '128GB (32x4)'],
        'Speed': ['6400MHz', '7200MHz', '8000MHz'],
        'Color': ['Silver RGB', 'Matte Black RGB']
      },
      optionPrices: {
        'Capacity': { '32GB (16x2)': 0, '64GB (32x2)': 5200, '128GB (32x4)': 14500 },
        'Speed': { '6400MHz': 0, '7200MHz': 1500, '8000MHz': 3800 },
        'Color': { 'Silver RGB': 0, 'Matte Black RGB': 200 }
      }
    }
  ],
  storage: [
    {
      id: 'st1', name: 'Samsung 990 PRO NVMe SSD', cat: 'storage',
      spec: 'PCIe 4.0 NVMe M.2 • Read up to 7450 MB/s • Heatsink Option',
      image: 'images/storage.png',
      basePrice: 3990,
      options: {
        'Capacity': ['1TB', '2TB', '4TB'],
        'Heatsink': ['Without Heatsink', 'With RGB Heatsink'],
        'Warranty': ['5 Years', '7 Years Extended']
      },
      optionPrices: {
        'Capacity': { '1TB': 0, '2TB': 3200, '4TB': 9800 },
        'Heatsink': { 'Without Heatsink': 0, 'With RGB Heatsink': 800 },
        'Warranty': { '5 Years': 0, '7 Years Extended': 1200 }
      }
    },
    {
      id: 'st2', name: 'WD_BLACK SN850X NVMe SSD', cat: 'storage',
      spec: 'Extreme Gaming PCIe Gen4 • Up to 7300 MB/s • Game Mode 2.0',
      image: 'images/storage.png',
      basePrice: 3490,
      options: {
        'Capacity': ['1TB', '2TB', '4TB'],
        'Heatsink': ['Standard', 'With WD Heatsink'],
        'Warranty': ['5 Years']
      },
      optionPrices: {
        'Capacity': { '1TB': 0, '2TB': 2900, '4TB': 8900 },
        'Heatsink': { 'Standard': 0, 'With WD Heatsink': 600 },
        'Warranty': { '5 Years': 0 }
      }
    },
    {
      id: 'st3', name: 'Kingston NV2 PCIe 4.0 NVMe SSD', cat: 'storage',
      spec: 'Budget NVMe M.2 2280 • Read up to 3500 MB/s • Low Power Efficiency',
      image: 'images/storage.png',
      basePrice: 1490,
      options: {
        'Capacity': ['512GB', '1TB', '2TB'],
        'Warranty': ['3 Years', '5 Years']
      },
      optionPrices: {
        'Capacity': { '512GB': 0, '1TB': 900, '2TB': 2500 },
        'Warranty': { '3 Years': 0, '5 Years': 400 }
      }
    }
  ],
  cooling: [
    {
      id: 'cl1', name: 'Noctua NH-D15 chromax.black', cat: 'cooling',
      spec: 'Dual-Tower Premium CPU Cooler • 2x NF-A15 PWM 140mm Fans • All Black',
      image: 'images/cooling.png',
      basePrice: 3990,
      options: {
        'Fan Config': ['Single Fan', 'Dual Fan 140mm'],
        'Mounting Kit': ['Standard LGA1700/AM5', 'Offset Mounting AM5'],
        'Warranty': ['6 Years']
      },
      optionPrices: {
        'Fan Config': { 'Single Fan': 0, 'Dual Fan 140mm': 700 },
        'Mounting Kit': { 'Standard LGA1700/AM5': 0, 'Offset Mounting AM5': 300 },
        'Warranty': { '6 Years': 0 }
      }
    },
    {
      id: 'cl2', name: 'Corsair iCUE Link H150i LCD AIO', cat: 'cooling',
      spec: '360mm Liquid CPU Cooler • 2.1" IPS LCD Screen • QX120 RGB Fans',
      image: 'images/cooling.png',
      basePrice: 8990,
      options: {
        'Radiator Size': ['240mm AIO', '360mm AIO', '420mm AIO'],
        'Color': ['Black', 'White'],
        'Screen Mod': ['Standard IPS', 'Custom Aluminum Ring']
      },
      optionPrices: {
        'Radiator Size': { '240mm AIO': -1500, '360mm AIO': 0, '420mm AIO': 2000 },
        'Color': { 'Black': 0, 'White': 400 },
        'Screen Mod': { 'Standard IPS': 0, 'Custom Aluminum Ring': 900 }
      }
    },
    {
      id: 'cl3', name: 'DeepCool AK620 Digital Air Cooler', cat: 'cooling',
      spec: 'Dual Tower CPU Cooler • Real-Time Digital Temperature Display • ARGB Strip',
      image: 'images/cooling.png',
      basePrice: 2290,
      options: {
        'Edition': ['Black Digital', 'White Digital', 'ZERO DARK Edition'],
        'Fan Speed': ['Standard 1800RPM', 'High Performance 2200RPM']
      },
      optionPrices: {
        'Edition': { 'Black Digital': 0, 'White Digital': 300, 'ZERO DARK Edition': 200 },
        'Fan Speed': { 'Standard 1800RPM': 0, 'High Performance 2200RPM': 400 }
      }
    }
  ]
};

var categoryMeta = {
  pc: { name: 'คอมพิวเตอร์', nameEn: 'Desktop PC', badge: 'PC', badgeClass: 'badge-pc' },
  laptop: { name: 'โน้ตบุ๊ก', nameEn: 'Laptop', badge: 'LAPTOP', badgeClass: 'badge-laptop' },
  gpu: { name: 'การ์ดจอ', nameEn: 'Graphics Card', badge: 'GPU', badgeClass: 'badge-gpu' },
  ram: { name: 'แรม (RAM)', nameEn: 'Memory (RAM)', badge: 'RAM', badgeClass: 'badge-ram' },
  storage: { name: 'ฮาร์ดดิสก์/SSD', nameEn: 'Storage (SSD)', badge: 'STORAGE', badgeClass: 'badge-storage' },
  cooling: { name: 'ระบายความร้อน', nameEn: 'Cooling System', badge: 'COOLING', badgeClass: 'badge-cooling' }
};

function formatPrice(p) {
  return '฿' + p.toLocaleString('en-US');
}

function calculateProductPrice(product, selectedOpts) {
  var price = product.basePrice || 0;
  var keys = Object.keys(product.options || {});
  
  if (product.presets) {
    var presetKey = keys.map(function (k) { return selectedOpts[k]; }).join('|');
    if (product.presets[presetKey] !== undefined) {
      return product.presets[presetKey];
    }
  }

  if (product.optionPrices) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var val = selectedOpts[k];
      if (product.optionPrices[k] && product.optionPrices[k][val] !== undefined) {
        price += product.optionPrices[k][val];
      }
    }
  }

  return price;
}

function getAllProducts() {
  var all = [];
  var cats = ['pc', 'laptop', 'gpu', 'ram', 'storage', 'cooling'];
  for (var c = 0; c < cats.length; c++) {
    var list = products[cats[c]] || [];
    for (var i = 0; i < list.length; i++) {
      all.push({ item: list[i], cat: cats[c], index: i });
    }
  }
  return all;
}

function renderProductsGrid(filter) {
  activeFilter = filter || 'all';
  var all = getAllProducts();
  var grid = document.getElementById('products-grid');
  var html = '';

  for (var i = 0; i < all.length; i++) {
    var p = all[i].item;
    var cat = all[i].cat;
    var idx = all[i].index;
    var meta = categoryMeta[cat];

    if (activeFilter !== 'all' && activeFilter !== cat) continue;

    html += '<div class="product-card" onclick="openProductModal(\'' + cat + '\', ' + idx + ')">';
    html += '<span class="card-badge ' + meta.badgeClass + '">' + meta.badge + '</span>';
    html += '<div class="card-img"><img src="' + p.image + '" alt="' + p.name + '"></div>';
    html += '<div class="card-body">';
    html += '<div class="card-name">' + p.name + '</div>';
    html += '<div class="card-spec">' + p.spec + '</div>';
    html += '<div class="card-footer">';
    html += '<span class="card-price">' + formatPrice(p.basePrice) + '</span>';
    html += '<button class="card-action" onclick="event.stopPropagation();openProductModal(\'' + cat + '\', ' + idx + ')">+</button>';
    html += '</div></div></div>';
  }

  grid.innerHTML = html;
}

function filterProducts(filter) {
  var btns = document.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active');
    if (btns[i].getAttribute('data-filter') === filter) {
      btns[i].classList.add('active');
    }
  }
  renderProductsGrid(filter);
}

function showPage(pageId) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }
  var page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  var navBtns = document.querySelectorAll('.top-nav-btn');
  for (var j = 0; j < navBtns.length; j++) {
    navBtns[j].classList.remove('active');
  }
  if (pageId === 'home-page') {
    var h = document.querySelector('[data-tab="home"]');
    if (h) h.classList.add('active');
  } else if (pageId === 'order-page') {
    var o = document.querySelector('[data-tab="orders"]');
    if (o) o.classList.add('active');
  } else if (pageId === 'credits-page') {
    var cr = document.querySelector('[data-tab="credits"]');
    if (cr) cr.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  currentCategory = null;
  currentProduct = null;
  selectedOptions = {};
  showPage('home-page');
}

function toggleMobileMenu() {
  var nav = document.getElementById('topbar-nav');
  nav.classList.toggle('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

function selectOption(key, value) {
  selectedOptions[key] = value;
  renderModal();
}

function renderModal() {
  var p = currentProduct;
  var optionsHTML = '';
  var keys = Object.keys(p.options || {});

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var values = p.options[key];
    optionsHTML += '<div class="option-group">';
    optionsHTML += '<p class="option-label">' + key + '</p>';
    optionsHTML += '<div class="option-list">';
    for (var j = 0; j < values.length; j++) {
      var v = values[j];
      var selClass = selectedOptions[key] === v ? 'selected' : '';
      
      var deltaText = '';
      if (p.optionPrices && p.optionPrices[key] && p.optionPrices[key][v] !== undefined) {
        var diff = p.optionPrices[key][v];
        if (diff > 0) {
          deltaText = ' (+฿' + diff.toLocaleString('en-US') + ')';
        } else if (diff < 0) {
          deltaText = ' (-฿' + Math.abs(diff).toLocaleString('en-US') + ')';
        }
      }

      var safeVal = v.replace(/'/g, "\\'");
      optionsHTML += '<button class="option-btn ' + selClass + '" onclick="selectOption(\'' + key + '\', \'' + safeVal + '\')">' + v + '<span class="opt-delta">' + deltaText + '</span></button>';
    }
    optionsHTML += '</div></div>';
  }

  currentPrice = calculateProductPrice(p, selectedOptions);

  var html = '<div class="modal-handle"></div>';
  html += '<h3 class="modal-title">' + p.name + '</h3>';
  html += '<p class="modal-subtitle">' + p.spec + '</p>';
  html += optionsHTML;
  html += '<div class="price-display"><span class="price-label">ราคารวม</span><span class="price-value">' + formatPrice(currentPrice) + '</span></div>';
  html += '<button class="btn-primary" onclick="buyNow()">🛒 สั่งซื้อเลย</button>';
  html += '<button class="btn-secondary" onclick="closeProductModal()">ยกเลิก</button>';

  document.getElementById('modal-body').innerHTML = html;
}

function openProductModal(cat, index) {
  currentCategory = cat;
  currentProduct = products[cat][index];
  selectedOptions = {};

  var keys = Object.keys(currentProduct.options);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    selectedOptions[key] = currentProduct.options[key][0];
  }

  renderModal();
  document.getElementById('product-modal').classList.add('active');
}

function buyNow() {
  closeProductModal();
  var p = currentProduct;
  var meta = categoryMeta[currentCategory];

  var summaryRows = '';
  summaryRows += '<div class="summary-row"><span class="label">สินค้า</span><span class="value">' + p.name + '</span></div>';
  summaryRows += '<div class="summary-row"><span class="label">หมวดหมู่</span><span class="value">' + meta.nameEn + '</span></div>';

  var keys = Object.keys(selectedOptions);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    summaryRows += '<div class="summary-row"><span class="label">' + key + '</span><span class="value">' + selectedOptions[key] + '</span></div>';
  }

  var container = document.querySelector('#order-page .sub-page');
  var html = '<div class="page-header"><button class="back-btn" onclick="goHome()">←</button><h2>สรุปคำสั่งซื้อ</h2></div>';
  html += '<p class="section-label">ตรวจสอบรายละเอียดก่อนยืนยัน</p>';
  html += '<div class="summary-card">' + summaryRows + '</div>';
  html += '<div class="summary-total"><span class="label">ยอดรวม</span><span class="value">' + formatPrice(currentPrice) + '</span></div>';
  html += '<button class="btn-primary" onclick="confirmOrder()">✓ ยืนยันคำสั่งซื้อ</button>';
  html += '<button class="btn-secondary" onclick="goHome()">ยกเลิก</button>';

  container.innerHTML = html;
  showPage('order-page');
}

function confirmOrder() {
  var overlay = document.getElementById('confirm-modal');
  overlay.innerHTML = '<div class="modal-content"><div class="confirm-icon">🛍️</div><h3 class="confirm-title">ยืนยันคำสั่งซื้อ?</h3><p class="confirm-text">คุณกำลังจะสั่งซื้อ <strong>' + currentProduct.name + '</strong> ในราคา <strong>' + formatPrice(currentPrice) + '</strong><br>การซื้อนี้เป็นการจำลอง</p><button class="btn-primary" onclick="orderSuccess()">ตกลง — สั่งซื้อ</button><button class="btn-secondary" onclick="closeConfirmModal()">ยกเลิก</button></div>';
  overlay.classList.add('active');
}

function orderSuccess() {
  if (currentProduct) {
    orderHistory.push({
      name: currentProduct.name,
      price: currentPrice,
      date: new Date().toLocaleDateString('th-TH')
    });
  }
  var overlay = document.getElementById('confirm-modal');
  overlay.innerHTML = '<div class="modal-content"><div class="success-checkmark">✅</div><h3 class="confirm-title">สั่งซื้อสำเร็จ!</h3><p class="confirm-text">คำสั่งซื้อ <strong>' + currentProduct.name + '</strong> ได้ถูกบันทึกเรียบร้อยแล้ว<br>ขอบคุณที่เลือกซื้อสินค้ากับ My PC Shop!</p><button class="btn-primary" onclick="finishOrder()">กลับหน้าแรก</button></div>';
}

function finishOrder() {
  closeConfirmModal();
  goHome();
}

function showCreditsPage() {
  renderCreditsGrid();
  showPage('credits-page');
}

async function renderCreditsGrid() {
  var grid = document.getElementById('credits-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="credits-empty"><span class="empty-icon">⏳</span>กำลังโหลดข้อมูล...</div>';
  try {
    var res = await fetch('/api/credits');
    var data = await res.json();
    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="credits-empty"><span class="empty-icon">👥</span>ยังไม่มีข้อมูลเครดิต</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      var avatarHTML = c.image
        ? '<img src="' + c.image + '" alt="' + c.name + '" class="credit-avatar">'
        : '<div class="credit-avatar-placeholder">👤</div>';
      html += '<div class="credit-card">';
      html += avatarHTML;
      html += '<div class="credit-name">' + c.name + '</div>';
      html += '<div class="credit-role">' + c.role + '</div>';
      html += '<div class="credit-id">' + (c.stdId ? '🎓 ' + c.stdId : '') + '</div>';
      html += '<div class="credit-desc">' + (c.desc || '') + '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = '<div class="credits-empty"><span class="empty-icon">⚠️</span>ไม่สามารถโหลดข้อมูลเครดิตได้</div>';
  }
}

function toggleConfigMode() {
  configModeOpen = !configModeOpen;
  var panel = document.getElementById('config-panel');
  var btn = document.getElementById('config-toggle-btn');
  if (configModeOpen) {
    panel.classList.add('open');
    btn.classList.add('active-config');
    btn.textContent = '✕ ปิดโหมดจัดการ';
  } else {
    panel.classList.remove('open');
    btn.classList.remove('active-config');
    btn.textContent = '⚙️ จัดการเครดิต';
    clearConfigForm();
  }
}

function saveCreditEntry() {
  var name  = document.getElementById('cfg-name').value.trim();
  var role  = document.getElementById('cfg-role').value.trim();
  var id    = document.getElementById('cfg-id').value.trim();
  var desc  = document.getElementById('cfg-desc').value.trim();
  var image = document.getElementById('cfg-image-data').value;
  var idx   = parseInt(document.getElementById('edit-index').value);

  if (!name || !role) {
    alert('กรุณากรอกชื่อและบทบาทอย่างน้อย');
    return;
  }

  var entry = { name: name, role: role, id: id, image: image, desc: desc };

  if (idx >= 0 && idx < creditsData.length) {
    creditsData[idx] = entry;
  } else {
    creditsData.push(entry);
  }

  clearConfigForm();
  renderCreditsGrid();
}

function editCreditEntry(idx) {
  var c = creditsData[idx];
  document.getElementById('cfg-name').value  = c.name || '';
  document.getElementById('cfg-role').value  = c.role || '';
  document.getElementById('cfg-id').value    = c.id   || '';
  document.getElementById('cfg-desc').value  = c.desc || '';
  document.getElementById('cfg-image-data').value = c.image || '';
  document.getElementById('edit-index').value = idx;

  var zone = document.getElementById('img-upload-zone');
  var preview = document.getElementById('img-upload-preview');
  if (c.image) {
    zone.classList.add('has-image');
    preview.innerHTML = '<img src="' + c.image + '" alt="preview"><div><span class="img-upload-text">รูปภาพปัจจุบัน</span><div class="img-preview-name">คลิกเพื่อเปลี่ยนรูป</div></div>';
  } else {
    zone.classList.remove('has-image');
    preview.innerHTML = '<span class="img-upload-icon">📷</span><span class="img-upload-text">คลิกเพื่อเลือกรูปภาพ<br><small>PNG, JPG, WEBP (ไม่เกิน 5MB)</small></span>';
  }

  if (!configModeOpen) toggleConfigMode();
  document.getElementById('config-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteCreditEntry(idx) {
  if (!confirm('ลบเครดิต "' + creditsData[idx].name + '" ออกใช่ไหม?')) return;
  creditsData.splice(idx, 1);
  renderCreditsGrid();
}

function clearConfigForm() {
  document.getElementById('cfg-name').value   = '';
  document.getElementById('cfg-role').value   = '';
  document.getElementById('cfg-id').value     = '';
  document.getElementById('cfg-desc').value   = '';
  document.getElementById('cfg-image-data').value = '';
  document.getElementById('cfg-image-input').value = '';
  document.getElementById('edit-index').value = '-1';
  var zone = document.getElementById('img-upload-zone');
  var preview = document.getElementById('img-upload-preview');
  if (zone) zone.classList.remove('has-image');
  if (preview) preview.innerHTML = '<span class="img-upload-icon">📷</span><span class="img-upload-text">คลิกเพื่อเลือกรูปภาพ<br><small>PNG, JPG, WEBP (ไม่เกิน 5MB)</small></span>';
}

function handleImageUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('ไฟล์ใหญ่เกินไป (5MB)');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    document.getElementById('cfg-image-data').value = dataUrl;
    var zone = document.getElementById('img-upload-zone');
    var preview = document.getElementById('img-upload-preview');
    zone.classList.add('has-image');
    preview.innerHTML =
      '<img src="' + dataUrl + '" alt="preview">'
      + '<div><span class="img-upload-text">' + file.name + '</span>'
      + '<div class="img-preview-name">คลิกเพื่อเปลี่ยนรูป</div></div>';
  };
  reader.readAsDataURL(file);
}

function showOrdersTab() {
  var container = document.querySelector('#order-page .sub-page');
  var html = '<div class="page-header"><button class="back-btn" onclick="goHome()">←</button><h2>คำสั่งซื้อ</h2></div>';
  html += '<div class="profile-card">';
  html += '<h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">รายการสั่งซื้อทั้งหมด (' + orderHistory.length + ')</h3>';
  if (orderHistory.length === 0) {
    html += '<p style="font-size:13px;color:var(--text3);padding:10px 0;">ยังไม่มีรายการสั่งซื้อ<br>สามารถเลือกซื้อสินค้าได้ที่หน้าแรก</p>';
    html += '<button class="btn-primary" onclick="goHome()" style="margin-top:10px;">ไปเลือกสินค้า</button>';
  } else {
    for (var i = 0; i < orderHistory.length; i++) {
      var item = orderHistory[i];
      html += '<div class="order-item">';
      html += '<div><div class="order-name">' + item.name + '</div><div class="order-date">' + item.date + ' • ชำระแล้ว</div></div>';
      html += '<div class="order-price">' + formatPrice(item.price) + '</div>';
      html += '</div>';
    }
  }
  html += '</div>';

  container.innerHTML = html;
  showPage('order-page');
}

window.onload = function () {
  renderProductsGrid('all');
  showPage('home-page');

  var navBtns = document.querySelectorAll('.top-nav-btn');
  for (var i = 0; i < navBtns.length; i++) {
    navBtns[i].addEventListener('click', function () {
      var target = this.getAttribute('data-tab');
      var mobileNav = document.getElementById('topbar-nav');
      mobileNav.classList.remove('open');

      if (target === 'home') {
        goHome();
      } else if (target === 'orders') {
        showOrdersTab();
      } else if (target === 'credits') {
        showCreditsPage();
      }
    });
  }

  document.getElementById('product-modal').addEventListener('click', function (e) {
    if (e.target === this) closeProductModal();
  });
  document.getElementById('confirm-modal').addEventListener('click', function (e) {
    if (e.target === this) closeConfirmModal();
  });
};
