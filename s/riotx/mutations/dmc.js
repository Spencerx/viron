import swagger from '../../swagger'
import constants from '../../core/constants';

export default {
  show: function (context, obj) {
    const schema = obj.model.responses[200].schema;
    // const properties = schema.properties;
    const response = obj.response;

    let merge = swagger.mergePropertiesAndResponse(schema, response);

    context.state.dmc = merge;
    return [constants.CHANGE_DMC];
  },
  remove: function (context) {
    context.state.dmc = null;
    return [constants.CHANGE_DMC];
  }
};