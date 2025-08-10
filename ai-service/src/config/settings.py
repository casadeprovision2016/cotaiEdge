"""
Configuration settings for CotAi Edge AI Service
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Service Configuration
    service_name: str = "cotai-edge-ai"
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # API Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Docling Configuration
    docling_artifacts_path: Optional[str] = Field(default=None, env="DOCLING_ARTIFACTS_PATH")
    enable_remote_services: bool = Field(default=False, env="DOCLING_ENABLE_REMOTE_SERVICES")
    
    # OCR Configuration
    ocr_engine: str = Field(default="easyocr", env="OCR_ENGINE")  # easyocr, tesseract, rapidocr
    ocr_languages: List[str] = Field(default=["pt", "en"], env="OCR_LANGUAGES")
    ocr_use_gpu: bool = Field(default=True, env="OCR_USE_GPU")
    
    # Processing Configuration
    max_file_size: int = Field(default=50_000_000, env="MAX_FILE_SIZE")  # 50MB
    max_pages: int = Field(default=1000, env="MAX_PAGES")
    num_threads: int = Field(default=4, env="OMP_NUM_THREADS")
    
    # Quality Thresholds
    quality_threshold_excellent: float = Field(default=0.9, env="QUALITY_THRESHOLD_EXCELLENT")
    quality_threshold_good: float = Field(default=0.7, env="QUALITY_THRESHOLD_GOOD")
    quality_threshold_fair: float = Field(default=0.5, env="QUALITY_THRESHOLD_FAIR")
    
    # Storage Configuration
    storage_root_path: str = Field(default="./storage", env="STORAGE_ROOT_PATH")
    temp_directory_path: str = Field(default="./temp", env="TEMP_DIRECTORY_PATH")
    results_directory_path: str = Field(default="./results", env="RESULTS_DIRECTORY_PATH")
    
    # Database Configuration
    supabase_url: str = Field(env="SUPABASE_URL")
    supabase_anon_key: str = Field(env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    
    # LLM Configuration
    llm_model: str = Field(default="llama-3.2", env="LLM_MODEL")
    llm_endpoint: Optional[str] = Field(default=None, env="LLM_ENDPOINT")
    llm_api_key: Optional[str] = Field(default=None, env="LLM_API_KEY")
    llm_max_tokens: int = Field(default=4096, env="LLM_MAX_TOKENS")
    
    # Security
    jwt_secret: str = Field(env="JWT_SECRET")
    allowed_origins: List[str] = Field(default=["*"], env="ALLOWED_ORIGINS")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary directories"""
        Path(self.storage_root_path).mkdir(parents=True, exist_ok=True)
        Path(self.temp_directory_path).mkdir(parents=True, exist_ok=True)
        Path(self.results_directory_path).mkdir(parents=True, exist_ok=True)
        
        if self.docling_artifacts_path:
            Path(self.docling_artifacts_path).mkdir(parents=True, exist_ok=True)
    
    @property
    def storage_path(self) -> Path:
        """Get storage path as Path object"""
        return Path(self.storage_root_path)
    
    @property
    def temp_dir(self) -> Path:
        """Get temp path as Path object"""
        return Path(self.temp_directory_path)
    
    def get_storage_path(self, ano: Optional[int] = None, uasg: Optional[str] = None, 
                        numero_pregao: Optional[str] = None) -> Path:
        """Get organized storage path"""
        base = self.storage_path
        
        if ano:
            base = base / str(ano)
        if uasg:
            base = base / uasg
        if numero_pregao:
            base = base / numero_pregao
            
        base.mkdir(parents=True, exist_ok=True)
        return base