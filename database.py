import databases
import sqlalchemy
from datetime import datetime
import os
import sqlite3
from typing import List, Dict, Any

DATABASE_URL = "sqlite:///./game2048.db"
DATABASE_FILE = "./game2048.db"

database = databases.Database(DATABASE_URL)

metadata = sqlalchemy.MetaData()

players = sqlalchemy.Table(
    "players",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String(32)),
    # 确保字段名与API中使用的一致
    sqlalchemy.Column("game_time", sqlalchemy.DateTime),
    sqlalchemy.Column("score", sqlalchemy.Integer),
    sqlalchemy.Column("is_success", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("ip_address", sqlalchemy.String(50)),
    sqlalchemy.Column("websocket_id", sqlalchemy.String(100)),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

engine = sqlalchemy.create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# 检查数据库文件是否存在
def database_exists(db_path: str = DATABASE_FILE) -> bool:
    return os.path.exists(db_path)

def init_db():
    # 如果数据库文件已存在，就不删除现有表，只确保表结构正确
    if database_exists():
        print(f"数据库 {DATABASE_FILE} 已存在，继续使用现有数据库。")
        # 只创建不存在的表，不会影响现有数据
        metadata.create_all(engine)
    else:
        print(f"创建新数据库: {DATABASE_FILE}")
        # 对于新数据库，创建所有必要的表
        metadata.create_all(engine)

# 初始化数据库（替代之前的直接执行代码）
init_db()
