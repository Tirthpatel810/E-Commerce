const app = angular.module('ecommApp', []);
app.controller('ecommCtrl', function($scope, $http) {
    $scope.user = { username: '', password: '' };
    $scope.isAuthenticated = false;
    $scope.role = '';
    $scope.errorMessage = '';
    $scope.loginUser = {};
    $scope.registerUser = {};
    $scope.errorMessage = '';
    $scope.registrationMessage = '';
    $scope.currentUser = {};

    $scope.currentForm = 'login';
    $scope.showForm = function(form) {
        $scope.currentForm = form;
    };

    $scope.login = function() {
        $http.post('/api/login', $scope.loginUser)
            .then(response => {
                $scope.isAuthenticated = true;
                $scope.errorMessage = '';
                $scope.currentUser = response.data;
                sessionStorage.setItem('currentUser', JSON.stringify($scope.currentUser));
                
                if ($scope.currentUser.user.role === 'seller') {
                    window.location.href = 'seller.html';
                } else if ($scope.currentUser.user.role === 'user'){
                    window.location.href = 'index.html';
                } else{
                    console.error("Invalid Role");
                }
        })
        .catch(error => {
            $scope.errorMessage = 'Invalid credentials. Please try again.';
        });
    };

    $scope.register = function() {
        if ($scope.registerUser.password !== $scope.registerUser.confirmPassword) {
            $scope.registrationMessage = 'Passwords do not match.';
            return;
        }

        $http.post('/api/register', $scope.registerUser)
            .then(response => {
                $scope.registrationMessage = 'Registration successful!';
                $scope.registerUser = {};
            })
            .catch(error => {
                $scope.registrationMessage = 'Registration failed. Please try again.';
            });
    };
});

app.controller('indexCtrl',function($scope,$http){
    $scope.currentUser = {};
    $scope.loggedin = false;
    $scope.popularProducts = [];

    $scope.logout = function() {
        sessionStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = 'index.html';
        $scope.loggedin = false;
        $scope.currentUser = {};
    }
    $scope.confirmLogout = function() {
        if (confirm("Are you sure you want to log out?")) {
          $scope.logout();
        }
    };
    
    try{
        const storedData = sessionStorage.getItem('currentUser');
        if (storedData) {
            const user = JSON.parse(storedData);
            $scope.currentUser = user.user;
            $scope.loggedin = true;
            console.log($scope.currentUser.username);
        } else {
            console.log("No user data found in sessionStorage.");
            }
        }
    catch{
        $scope.currentUser = {};
    }

    $http.get('/api/popular-products')
        .then(response => {
            $scope.popularProducts = response.data;
        }).catch(error => console.error('Error fetching popular products:', error));
});

app.controller('sellerCtrl', function($scope, $http) {
    $scope.currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
    $scope.products = [];
    $scope.newProduct = {};
    $scope.updateMode = false;
    $scope.addProductView = false;
    $scope.viewProductView = false;
    $scope.soldProductView = false;

    $scope.confirmAction = function(productId) {
        if (confirm("Are you sure you want Delete Product?")) {
            $scope.deleteProduct(productId);
        }
    };

    // Load seller's products
    $scope.loadProducts = function() {
        $http.get('/api/products', { params: { sellerName: $scope.currentUser.user.username } })
            .then(response => {
                $scope.products = response.data;
            })
            .catch(error => console.error('Error loading products:', error));
    };

    // Add new product
    $scope.addProduct = function() {
        const productData = { ...$scope.newProduct, sellerName: $scope.currentUser.user.username };
        $http.post('/api/products', productData)
            .then(response => {
                $scope.products.push(response.data);
                $scope.newProduct = {};
                alert("Product added successfully");
            })
            .catch(error => console.error('Error adding product:', error));
    };

    // Edit existing product
    $scope.editProduct = function(product) {
        $scope.updateMode = true;
        $scope.addProductView = true;
        $scope.newProduct = angular.copy(product);
    };

    // Update product
    $scope.updateProduct = function() {
        $http.put(`/api/products/${$scope.newProduct._id}`, $scope.newProduct)
            .then(response => {
                const index = $scope.products.findIndex(p => p._id === $scope.newProduct._id);
                $scope.products[index] = response.data;
                $scope.newProduct = {};
                $scope.updateMode = false;
                $scope.addProductView = false;
                alert("Product updated successfully");
            })
            .catch(error => console.error('Error updating product:', error));
    };

    // Delete product
    $scope.deleteProduct = function(_id) {
        $http.delete(`/api/products/${_id}`)
            .then(() => {
                $scope.products = $scope.products.filter(p => p._id !== _id);
                alert("Product deleted successfully");
            })
            .catch(error => console.error('Error deleting product:', error));
    };

    // Logout function
    $scope.logout = function() {
        sessionStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = 'index.html';
        $scope.loggedin = false;
        $scope.currentUser = {};
    };
    $scope.confirmLogout = function() {
        if (confirm("Are you sure you want to log out?")) {
          $scope.logout();
        }
    };

    // Load products on initialization
    $scope.loadProducts();
});

app.controller('productCtrl', function ($scope, $http) {
    $scope.products = [];
    $scope.cart = [];
    $scope.currentUser = {};
    $scope.loggedin = false;

    $scope.logout = function() {
        sessionStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = 'index.html';
        $scope.loggedin = false;
        $scope.currentUser = {};
    }
    $scope.confirmLogout = function() {
        if (confirm("Are you sure you want to log out?")) {
          $scope.logout();
        }
    };

    // Fetch products from the API
    $http.get('/api/getproducts').then(response => {
        $scope.products = response.data;
    }).catch(error => console.error("Error fetching products:", error));

    // Add product to the cart
    $scope.addToCart = function (product) {
        let existingProduct = $scope.cart.find(item => item._id === product._id);
    
        try {
            const storedData = sessionStorage.getItem('currentUser');
            if (storedData) {
                const user = JSON.parse(storedData);
                $scope.currentUser = user.user;
                $scope.loggedin = true;
            } else {
                alert("Login Required");
                window.location.href = 'login.html';
                return;
            }
        } catch {
            $scope.currentUser = {};
        }
    
        if (existingProduct) {
            existingProduct.quantity += 1;
            existingProduct.total = existingProduct.quantity * existingProduct.price;
        } else {
            product.userId = $scope.currentUser._id;
            product.productId = product._id;
            product.username = $scope.currentUser.username;
            product.quantity = 1;
            product.total = product.price;
            $scope.cart.push(product);
        }
    
        console.log("Added to cart:", product.productName);
    
        $http.post('/api/saveCart/', { cart: $scope.cart , userId: $scope.currentUser._id})
            .then(response => {
                console.log("Cart saved successfully", response.data);
            })
            .catch(error => {
                console.error("Error saving cart:", error);
            });
    };

    $scope.getCart = function () {
        const storedData = sessionStorage.getItem('currentUser');
        if (storedData) {
            const user = JSON.parse(storedData);
            const userId = user.user._id;
            $scope.loggedin = true;

            $http.get(`/api/getCart/${userId}`)
                .then(response => {
                    $scope.cart = response.data;
                })
                .catch(error => {
                    console.error("Error fetching cart data:", error);
                });
        } else {
            alert("Please log in to view your cart.");
            window.location.href = 'login.html';
        }
    };

    // Calculate total cart value
    $scope.calculateCartTotal = function () {
        return $scope.cart.reduce((sum, item) => sum + item.total, 0);
    };

    // Increase quantity
    $scope.increaseQuantity = function (item) {
        item.quantity += 1;
        item.total = item.price * item.quantity;
        $scope.updateCart();
    };

    // Decrease quantity
    $scope.decreaseQuantity = function (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
            item.total = item.price * item.quantity;
            $scope.updateCart();
        }
    };

    // Remove item from cart
    $scope.removeFromCart = function (item) {
        const index = $scope.cart.indexOf(item);
        if (index > -1) {
            $scope.cart.splice(index, 1);
            $scope.updateCart();
        }
    };

    // Save cart changes to server
    $scope.updateCart = function () {
        const storedData = sessionStorage.getItem('currentUser');
        if (storedData) {
            const user = JSON.parse(storedData);
            const userid = user.user._id;
        $http.post('/api/saveCart/', { cart: $scope.cart, userId: userid})
            .then(response => {
                console.log("Cart updated successfully", response.data);
            })
            .catch(error => {
                console.error("Error updating cart:", error);
            });
        }
    };

    $scope.checkout = function(paymentMethod) {
        if ($scope.cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }
    
        // Prepare the order data
        const orderData = {
            userId: $scope.currentUser._id,
            cart: $scope.cart,
            paymentMethod: paymentMethod
        };
    
        // Call the checkout API
        $http.post('/api/checkout', orderData)
            .then(response => {
                if (paymentMethod === 'razorpay') {
                    // Handle Razorpay Payment
                    initiateRazorpayPayment(response.data);
                } else {
                    alert('Order placed successfully with Cash on Delivery!');
                    // Redirect or update UI as necessary
                }
            })
            .catch(error => {
                console.error("Error during checkout:", error);
                alert("An error occurred while placing your order.");
            });
    };
    
    // Function to initiate Razorpay payment
    function initiateRazorpayPayment(orderData) {
        var options = {
            key: RAZORPAY_KEY_ID, // Razorpay Key ID
            amount: orderData.amount, // Amount in paise
            currency: 'INR',
            name: 'Your Shop Name',
            description: 'Order Payment',
            order_id: orderData.orderId, // The Razorpay order ID
            handler: function(response) {
                // After successful payment
                updateOrderStatus(response.razorpay_payment_id);
            },
            prefill: {
                name: $scope.currentUser.username,
                email: $scope.currentUser.email,
            },
            theme: {
                color: '#F37254'
            }
        };
    
        var rzp1 = new Razorpay(options);
        rzp1.open();
    }
    
    // Function to update order status after successful payment
    function updateOrderStatus(paymentId) {
        $http.put('/api/updateOrder', { paymentId: paymentId })
            .then(response => {
                alert('Payment successful. Your order is being processed.');
                // Update UI or redirect as needed
            })
            .catch(error => {
                console.error("Error updating order status:", error);
                alert('Error processing payment.');
            });
    }

});
