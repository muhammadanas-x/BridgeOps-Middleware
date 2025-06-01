import mongoose from 'mongoose';
        
        const userSchema = new mongoose.Schema({
          name: {
            type: String,
            required: [true, 'Please provide a name'],
          },
          email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
          },
          password: {
            type: String,
            required: [true, 'Please provide a password'],
          },
          role: {
            type: String,
            required: [true, 'Please specify a role'],
          }
        }, {
          timestamps: true
        });
        
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        
        export default User;