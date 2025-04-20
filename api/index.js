const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const cors = require('cors'); 
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'db.trqvushwhkvchkgqhmge.supabase.co',
    database: 'postgres',
    password: 'elby1776',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1', 
            [email]
        );
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );
        
        res.status(201).json({ 
            message: "User registered successfully",
            user: newUser.rows[0]
        });
        
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // Check if user exists
        const userResult = await pool.query(
            'SELECT id, password FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const user = userResult.rows[0];
        
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials 2" });
        }
        
        // Successful login - return minimal response
        res.status(200).json({
            success: true,
            message: "Login successful",
            userId: user.id
        });
        
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// // GOOGLE AUTH
// const SECRET_KEY = 'c1f46eee8c1b09d7667519796021ed0701a452ea208bb6107f392b3108d47b99e7fae774fd7914ceea0d202631507b7633311af1976983370889fd8984a65ebc';

// // Session and Passport (kept for Google Auth)
// app.use(session({ secret: SECRET_KEY, resave: false, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Google Strategy (optional)
// passport.use(new GoogleStrategy({
//   clientID: '1046052573504-3f0ug0rus1t7dd8k84ckh06lslg36h1j.apps.googleusercontent.com',
//   clientSecret: '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',
//   callbackURL: 'http://localhost:5000/auth/google/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;
//     const username = profile.displayName;
//     let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (user.rows.length === 0) {
//       user = await pool.query(
//         'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
//         [username, email, '']
//       );
//     }
//     done(null, user.rows[0]);
//   } catch (error) {
//     done(error, null);
//   }
// }));

// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//   const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
//   done(null, user.rows[0]);
// });


// // Google Auth Routes
// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['profile', 'email'] })
//   );
  
//   app.get('/auth/google/callback', 
//     passport.authenticate('google', { 
//       failureRedirect: '/login',
//       session: false // We're not using sessions for our API
//     }),
//     (req, res) => {
//       // Successful authentication, return user info or JWT
//       res.json({
//         success: true,
//         message: "Google login successful",
//         user: req.user
//       });
//     }
//   );

  app.post('/produk', async (req, res) => {
    const {
      nama_pelanggan,
      nama_produk,
      harga,
      kuantitas,
      kategori,
      pengiriman,
      metode_pembayaran,
      kurir,
      kota_pelanggan,
      provinsi,
      tanggal_pembelian
    } = req.body;
  
    try {
      const newProduct = await pool.query(
        `INSERT INTO tabel_produk (
          nama_pelanggan, nama_produk, harga, kuantitas, kategori, 
          pengiriman, metode_pembayaran, kurir, kota_pelanggan, 
          provinsi, tanggal_pembelian
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          nama_pelanggan, nama_produk, harga, kuantitas, kategori,
          pengiriman, metode_pembayaran, kurir, kota_pelanggan,
          provinsi, tanggal_pembelian
        ]
      );
      res.json({ message: 'Product added successfully', product: newProduct.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/produk', async (req, res) => {
    try {
      const allProducts = await pool.query('SELECT * FROM tabel_produk ORDER BY no DESC');
      res.json(allProducts.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/produk/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const product = await pool.query('SELECT * FROM tabel_produk WHERE no = $1', [id]);
      if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      res.json(product.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put('/produk/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nama_pelanggan,
      nama_produk,
      harga,
      kuantitas,
      kategori,
      pengiriman,
      metode_pembayaran,
      kurir,
      kota_pelanggan,
      provinsi,
      tanggal_pembelian
    } = req.body;
  
    try {
      const updatedProduct = await pool.query(
        `UPDATE tabel_produk SET 
          nama_pelanggan=$1, nama_produk=$2, harga=$3, kuantitas=$4, kategori=$5,
          pengiriman=$6, metode_pembayaran=$7, kurir=$8, kota_pelanggan=$9,
          provinsi=$10, tanggal_pembelian=$11
        WHERE no=$12 RETURNING *`,
        [
          nama_pelanggan, nama_produk, harga, kuantitas, kategori,
          pengiriman, metode_pembayaran, kurir, kota_pelanggan,
          provinsi, tanggal_pembelian, id
        ]
      );
      res.json({ message: 'Product updated', product: updatedProduct.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete('/produk/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM tabel_produk WHERE no = $1', [id]);
      res.json({ message: 'Product deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // In your backend server (e.g., server.js)
  app.delete('/deleteall', async (req, res) => {
    try {
      console.log("Biel");
      // Delete all products from PostgreSQL table
      await pool.query('DELETE FROM tabel_produk');
      
      // Optional: Reset the auto-increment sequence
      await pool.query('ALTER SEQUENCE tabel_produk_no_seq RESTART WITH 1');
      
      res.status(200).json({ message: 'All products deleted successfully' });
    } catch (error) {
      console.error('Error deleting all products:', error);
      res.status(500).json({ error: 'Failed to delete all products' });
    }
  });
  
  app.get('/top-products', async (req, res) => {
    try {
      // First check if we have any products
      const productCount = await pool.query('SELECT COUNT(*) FROM tabel_produk');
      const hasProducts = parseInt(productCount.rows[0].count) > 0;
  
      // if (!hasProducts) {
      //   // Return mock data if no products exist
      //   return res.json([
      //     {
      //       nama_produk: "Smartphone X",
      //       total_sold: 150,
      //       total_revenue: 75000000,
      //       kategori: "Electronics"
      //     },
      //     {
      //       nama_produk: "Designer T-Shirt",
      //       total_sold: 120,
      //       total_revenue: 3600000,
      //       kategori: "Fashion"
      //     },
      //     {
      //       nama_produk: "Organic Coffee",
      //       total_sold: 95,
      //       total_revenue: 2850000,
      //       kategori: "Food & Beverage"
      //     }
      //   ]);
      // }
  
      // Otherwise return real data
      const topProducts = await pool.query(`
        SELECT 
          nama_produk,
          SUM(kuantitas) as total_sold,
          SUM(harga * kuantitas) as total_revenue,
          kategori
        FROM tabel_produk
        GROUP BY nama_produk, kategori
        ORDER BY total_sold DESC, total_revenue DESC
        LIMIT 3
      `);
  
      const formattedProducts = topProducts.rows.map(product => ({
        ...product,
        total_revenue: Number(product.total_revenue),
        total_sold: Number(product.total_sold)
      }));
  
      res.json(formattedProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
      res.status(500).json({ error: 'Failed to fetch top products' });
    }
  });

app.listen(5000, () => {
    console.log("Server listening on port 3000");
});

// module.exports = app; 