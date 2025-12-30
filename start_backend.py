"""
AI Finance Assistant Backend Startup Script
Enhanced with dependency checking and agent testing
"""

import uvicorn
import logging
import sys
import os
import asyncio
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are installed"""
    
    logger.info("🔍 Checking dependencies...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'python-multipart',
        'Pillow',
        'numpy',
        'pandas'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            # Handle special package name mappings
            import_name = package.replace('-', '_')
            if package == 'Pillow':
                import_name = 'PIL'
            elif package == 'python-multipart':
                import_name = 'multipart'
            
            __import__(import_name)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"❌ Missing required packages: {', '.join(missing_packages)}")
        logger.info("📦 Install missing packages with: pip install -r requirements.txt")
        return False
    
    logger.info("✅ All required dependencies are installed")
    return True

def check_environment():
    """Check environment configuration"""
    
    logger.info("🔧 Checking environment configuration...")
    
    # Check for optional API keys
    optional_keys = {
        'OPENAI_API_KEY': 'OpenAI GPT models',
        'GOOGLE_API_KEY': 'Google Vision API',
        'AWS_ACCESS_KEY_ID': 'AWS Textract',
        'FIREBASE_PROJECT_ID': 'Firebase Authentication'
    }
    
    configured_services = []
    missing_services = []
    
    for key, service in optional_keys.items():
        if os.getenv(key):
            configured_services.append(service)
        else:
            missing_services.append(service)
    
    if configured_services:
        logger.info(f"✅ Configured services: {', '.join(configured_services)}")
    
    if missing_services:
        logger.warning(f"⚠️ Optional services not configured: {', '.join(missing_services)}")
        logger.info("💡 The backend will work with basic functionality. Add API keys to .env file for full features.")
    
    return True

def create_directories():
    """Create necessary directories"""
    
    logger.info("📁 Creating necessary directories...")
    
    directories = [
        "uploads",
        "logs", 
        "data"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"✅ Created directory: {directory}")
    
    return True

def start_server():
    """Start the FastAPI server"""
    
    logger.info("🚀 Starting AI Finance Assistant Backend Server...")
    
    try:
        logger.info("🌐 Server will be available at:")
        logger.info("   • Local: http://localhost:8000")
        logger.info("   • Network: http://0.0.0.0:8000")
        logger.info("   • API Docs: http://localhost:8000/docs")
        logger.info("   • Health Check: http://localhost:8000/health")
        logger.info("   • Agent Status: http://localhost:8000/api/agents/status")
        
        uvicorn.run(
            "backend.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("👋 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {str(e)}")
        sys.exit(1)

def main():
    """Main startup function"""
    
    print("=" * 60)
    print("🤖 AI Finance Assistant Backend")
    print("=" * 60)
    
    # Step 1: Check dependencies
    if not check_dependencies():
        logger.error("❌ Dependency check failed. Please install required packages.")
        sys.exit(1)
    
    # Step 2: Check environment
    if not check_environment():
        logger.error("❌ Environment check failed.")
        sys.exit(1)
    
    # Step 3: Create directories
    if not create_directories():
        logger.error("❌ Directory creation failed.")
        sys.exit(1)
    
    # Step 4: Start server
    logger.info("🎉 Pre-flight checks completed successfully!")
    logger.info("🚀 Starting server...")
    logger.info("💡 Tip: Use Ctrl+C to stop the server")
    
    start_server()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("👋 Goodbye!")
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        sys.exit(1)