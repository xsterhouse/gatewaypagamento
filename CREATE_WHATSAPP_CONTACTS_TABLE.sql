-- Criar tabela de contatos para envio de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_created_at ON whatsapp_contacts(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança - Apenas admins podem acessar
CREATE POLICY "Admins can view whatsapp contacts" ON whatsapp_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert whatsapp contacts" ON whatsapp_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update whatsapp contacts" ON whatsapp_contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete whatsapp contacts" ON whatsapp_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_whatsapp_contacts_updated_at 
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_contacts IS 'Tabela de contatos para envio em massa via WhatsApp';
COMMENT ON COLUMN whatsapp_contacts.name IS 'Nome do contato';
COMMENT ON COLUMN whatsapp_contacts.phone IS 'Número de telefone (apenas dígitos)';
