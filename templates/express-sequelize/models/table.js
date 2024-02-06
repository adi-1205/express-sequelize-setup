
module.exports = (sequelize, DataTypes) => {
    const TableName1 = sequelize.define('TableName2', {
    }, {
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        tableName: 'TableName2',
    })

    TableName1.associate = function (models) {    
    }
    return TableName1
}