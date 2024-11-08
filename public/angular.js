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

app.controller('ProductController', function($scope) {
    $scope.products = [
    { id: 1, name: 'Product 1', price: 100, description: 'Description of product 1' },
    { id: 2, name: 'Product 2', price: 200, description: 'Description of product 2' }
    ];

    $scope.addToCart = function(product) {
    alert(`${product.name} added to cart!`);
    };
    });

    app.controller('AdminController', function($scope) {
    $scope.products = [
    { id: 1, name: 'Product 1', price: 100, description: 'Description of product 1' },
    { id: 2, name: 'Product 2', price: 200, description: 'Description of product 2' }
    ];

    $scope.newProduct = { name: '', price: '', description: '' };

    $scope.addProduct = function() {
    const newProduct = { ...$scope.newProduct, id: Date.now() };
    $scope.products.push(newProduct);
    $scope.newProduct = { name: '', price: '', description: '' };
    };

    $scope.deleteProduct = function(id) {
    $scope.products = $scope.products.filter(product => product.id !== id);
};
});

app.controller('indexCtrl',function($scope){
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
