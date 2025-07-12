### Project Overview  
**Kryptoria** is a web application designed for interactive learning of cryptography, focusing on the Caesar cipher. Developed as part of a coursework project in "Information Systems Design," the app visualizes encryption algorithms, offers hands-on exercises, and provides educational modules to help users grasp cryptographic concepts.  

### Key Features  
1. **Interactive Caesar Cipher Visualization**:  
   - Step-by-step encryption/decryption with detailed explanations.  
   - Customizable alphabet (English/Russian), shift key, and input text.  
   - Visual representation of original and shifted alphabets.  
2. **Demonstration Examples**:  
   - Pre-built examples with annotated steps for clarity.  
3. **Practical Exercises**:  
   - Three task types: key detection, message decryption, and text encryption.  
   - Auto-generated tasks with varying difficulty levels and instant feedback.  
4. **User System**:  
   - Registration, JWT-based authentication, and password recovery.  
   - Personalized profile management.  
5. **Admin Panel**:  
   - User management (view, edit, delete accounts).  
6. **UI/UX**:  
   - Responsive design, light/dark themes, and multilingual support (English/Russian).

### Technology Stack  
**Backend**:  
- **Language**: Java  
- **Framework**: Spring Boot (MVC, Data JPA, Security)  
- **Database**: MySQL  
- **Authentication**: JWT  
- **Build**: Maven/Gradle  

**Frontend**:  
- **Library**: React  
- **Routing**: react-router-dom  
- **i18n**: i18next  
- **Build**: Vite  
- **HTTP Client**: Axios  

**Infrastructure**:  
- REST API architecture with JSON data exchange.  

### Architecture Highlights  
- **Backend**:  
  - Layered structure (controllers, services, repositories, DTOs).  
  - `CipherService` class implements Caesar cipher logic (see [code](CipherService.java)).  
- **Frontend**:  
  - Component-based React app with global state management (Context API).  
- **Database**:  
  - Entities: `User`, `Role`, `RefreshToken` (see [ER Diagram](ER_Diagram.png)).  

### Implementation Notes  
1. **Caesar Cipher**:  
   - Handles case sensitivity and non-alphabetic characters.  
   - Formulas:  
     - Encryption: `C_i = (P_i + K) mod N`  
     - Decryption: `P_i = (C_i - K + N) mod N`  
2. **Visualization**:  
   - Each character transformation is logged with contextual details (position, operation, result).  
3. **Security**:  
   - Password hashing, role-based access control (admin/user).  

### Setup & Deployment  
1. **Backend**:  
   ```bash 
   mvn spring-boot:run 
   ```  
2. **Frontend**:  
   ```bash 
   npm install 
   npm run dev 
   ```  
3. **Configuration**:  
   - DB settings in `application.properties`.  
   - Translation files in `/locales`.  

### Future Enhancements  
- Add more ciphers (e.g., AES, RSA).  
- Gamification (achievements, leaderboards).  
- Expand theoretical resources (glossary, tutorials).  
- User feedback integration.  

### Demo  
Watch the project demo here: [Kryptoria Demo Video](https://youtu.be/gPdu2rw_OFs)  
