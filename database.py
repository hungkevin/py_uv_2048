import databases
import sqlalchemy
from datetime import datetime

DATABASE_URL = "sqlite:///./test.db"

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

# 删除旧表并创建新表
metadata.drop_all(engine)  # 警告：这将删除现有表中的所有数据
metadata.create_all(engine)
